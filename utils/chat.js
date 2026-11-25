/**
 * LLM helpers: Ollama (wabot) -> Gemini for chat (askLLM), NVIDIA Nemotron -> Gemini for
 * one-shot command tasks (askHeavy). All expose OpenAI-compatible /chat/completions,
 * so one request shape serves them.
 */
import dotenv from "dotenv";

dotenv.config();
const OLLAMA_URL = "http://127.0.0.1:11434/v1/chat/completions";
const OLLAMA_MODEL = "wabot";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
// Normal replies land in 1-5s; the free tier sometimes stalls a request for good, so fail over early.
const NVIDIA_TIMEOUT_MS = 12000;
const NVIDIA_RPM = 36; // the key allows 40/min; headroom for clock skew
const TIMEOUT_MS = 15000;
const MAX_LOCAL_CHARS = 1500;

async function complete(
  url,
  model,
  messages,
  maxTokens,
  apiKey,
  timeoutMs = TIMEOUT_MS,
  extra = {},
) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
    body: JSON.stringify({ model, messages, stream: false, max_tokens: maxTokens, ...extra }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${model} HTTP ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${model} returned an empty reply`);
  return text;
}

async function askGemini(messages, maxTokens, reason) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const start = Date.now();
  const text = await complete(GEMINI_URL, GEMINI_MODEL, messages, maxTokens, key);
  console.log(`[askLLM] gemini/${GEMINI_MODEL} (${reason}) ${Date.now() - start}ms`);
  return text;
}

// USE_LOCAL_LLM=false (or 0) skips Ollama entirely; unset means enabled.
const localEnabled = () => !/^(false|0)$/i.test(process.env.USE_LOCAL_LLM?.trim() ?? "");

/**
 * USE_LOCAL_LLM=false sends everything to Gemini. Otherwise, prompts over MAX_LOCAL_CHARS (system message excluded) go straight to Gemini,
 * since the local model runs with a 2048-token context.
 * @param {{role: "system"|"user"|"assistant", content: string}[]} messages
 * @param {{maxTokens?: number}} [opts]
 * @returns {Promise<string>} reply text
 */
export async function askLLM(messages, { maxTokens } = {}) {
  const chars = messages.reduce(
    (n, m) => (m.role === "system" ? n : n + (m.content?.length ?? 0)),
    0,
  );
  if (!localEnabled()) return askGemini(messages, maxTokens, "USE_LOCAL_LLM=false");
  if (chars > MAX_LOCAL_CHARS) {
    return askGemini(messages, maxTokens, `prompt ${chars} chars > ${MAX_LOCAL_CHARS}`);
  }

  const start = Date.now();
  try {
    const text = await complete(OLLAMA_URL, OLLAMA_MODEL, messages, maxTokens);
    console.log(`[askLLM] ollama/${OLLAMA_MODEL} (local) ${Date.now() - start}ms`);
    return text;
  } catch (err) {
    console.warn(`[askLLM] ollama failed after ${Date.now() - start}ms: ${err.message}`);
    return askGemini(messages, maxTokens, "fallback");
  }
}

// Sliding one-minute window shared by every command, so the bot never trips NVIDIA's 429.
const nvidiaCalls = [];
function takeNvidiaSlot() {
  const cutoff = Date.now() - 60_000;
  while (nvidiaCalls.length && nvidiaCalls[0] < cutoff) nvidiaCalls.shift();
  if (nvidiaCalls.length >= NVIDIA_RPM) return false;
  nvidiaCalls.push(Date.now());
  return true;
}

/**
 * One-shot task for commands (parse, translate, answer): Nemotron with thinking off for speed,
 * Gemini when NVIDIA_API_KEY is unset, the per-minute budget is spent, or the call fails.
 * Nemotron has no structured-output mode, so callers wanting JSON must ask for it in the prompt
 * and validate the result themselves.
 * @param {{role: "system"|"user"|"assistant", content: string}[]} messages
 * @param {{maxTokens?: number, timeoutMs?: number}} [opts] timeoutMs bounds the Nemotron attempt only
 * @returns {Promise<string>} reply text
 */
export async function askHeavy(messages, { maxTokens = 512, timeoutMs = NVIDIA_TIMEOUT_MS } = {}) {
  const key = process.env.NVIDIA_API_KEY;
  let reason = "NVIDIA_API_KEY not set";
  if (key) {
    const start = Date.now();
    if (takeNvidiaSlot()) {
      try {
        const text = await complete(NVIDIA_URL, NVIDIA_MODEL, messages, maxTokens, key, timeoutMs, {
          temperature: 0.3,
          chat_template_kwargs: { enable_thinking: false },
        });
        console.log(`[askHeavy] nvidia/${NVIDIA_MODEL} ${Date.now() - start}ms`);
        return text;
      } catch (err) {
        reason = "nvidia failed";
        console.warn(`[askHeavy] nvidia failed after ${Date.now() - start}ms: ${err.message}`);
      }
    } else reason = `nvidia over ${NVIDIA_RPM} rpm`;
  }
  return askGemini(messages, maxTokens, reason);
}
