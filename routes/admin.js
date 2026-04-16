import { Router } from "express";
import { group } from "../mongo-DB/groupDataDb.js";
import { member } from "../mongo-DB/membersDataDb.js";
import { bot, getBotData } from "../mongo-DB/botDataDb.js";
import { cmdToText } from "../functions/getAddCommands.js";
import mdClient from "../mongodb.js";

const router = Router();

// ── Auth middleware ────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
	if (req.session && req.session.isAdmin) return next();
	if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Unauthorized" });
	return res.redirect("/admin/login");
}

// ── Public bot status (no auth — used by index.ejs to poll connection state) ──
router.get("/api/status", (req, res) => {
	const sock = req.app.locals.sock;
	res.json({
		connected: !!(sock?.user),
		registered: !!(sock?.authState?.creds?.registered),
	});
});

// ── Public pairing code endpoint (same trust level as the QR page) ───────────
// Anyone who can see the QR page can also request a pairing code.
router.post("/api/pair", async (req, res) => {
	const { phoneNumber } = req.body;
	if (!phoneNumber) return res.status(400).json({ error: "Phone number required." });

	const sock = req.app.locals.sock;
	if (!sock) return res.status(503).json({ error: "Bot is not ready yet. Try again in a moment." });

	if (sock.authState?.creds?.registered) {
		return res.status(400).json({ error: "Bot is already logged in. Use the admin panel to manage the connection." });
	}

	try {
		const clean = String(phoneNumber).replace(/\D/g, "");
		if (clean.length < 7) return res.status(400).json({ error: "Invalid phone number — include country code, digits only." });
		const code = await sock.requestPairingCode(clean);
		res.json({ ok: true, code });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── JSON auth endpoints (used by React app) ────────────────────────────────────

router.get("/api/admin/me", (req, res) => {
	if (req.session?.isAdmin) return res.json({ authenticated: true });
	res.status(401).json({ authenticated: false });
});

router.post("/api/admin/login", (req, res) => {
	const { password } = req.body;
	if (password === process.env.ADMIN_PASSWORD) {
		req.session.isAdmin = true;
		return res.json({ ok: true });
	}
	res.status(401).json({ error: "Incorrect password." });
});

router.post("/api/admin/logout", (req, res) => {
	req.session.destroy(() => res.json({ ok: true }));
});

// ── Legacy form login/logout (kept for QR page fallback) ─────────────────────

router.get("/admin/login", (req, res) => {
	// Serve React SPA — index.html is served by the static middleware in index.js
	// This GET is only reached when the static file isn't found; redirect to root.
	if (req.session?.isAdmin) return res.redirect("/admin");
	res.redirect("/admin/#/login");
});

router.post("/admin/login", (req, res) => {
	const { password } = req.body;
	if (password === process.env.ADMIN_PASSWORD) {
		req.session.isAdmin = true;
		return res.redirect("/admin");
	}
	res.render("login", { error: "Incorrect password." });
});

router.post("/admin/logout", (req, res) => {
	req.session.destroy(() => res.redirect("/admin/login"));
});

// ── API: Stats ─────────────────────────────────────────────────────────────────
router.get("/api/admin/stats", requireAdmin, async (req, res) => {
	try {
		const [groupCount, memberCount, botData] = await Promise.all([
			group.countDocuments(),
			member.countDocuments(),
			getBotData(),
		]);
		res.json({
			uptime: Math.floor(process.uptime()),
			groupCount,
			memberCount,
			botNumber: process.env.BOT_NUMBER?.split(",")[0] || "Unknown",
			disabledGlobally: botData?.disabledGlobally || [],
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── API: Analytics (new) ───────────────────────────────────────────────────────
router.get("/api/admin/analytics", requireAdmin, async (req, res) => {
	try {
		const [groups, members] = await Promise.all([
			group.find({}, { projection: { grpName: 1, totalMsgCount: 1, isBotOn: 1 } }).toArray(),
			member.find({}).toArray(),
		]);

		// Top 10 groups by messages
		const topGroups = [...groups]
			.sort((a, b) => (b.totalMsgCount || 0) - (a.totalMsgCount || 0))
			.slice(0, 10)
			.map(g => ({
				name: (g.grpName || g._id).slice(0, 22),
				messages: g.totalMsgCount || 0,
				active: g.isBotOn,
			}));

		// Top 10 members by total messages
		const topMembers = [...members]
			.sort((a, b) => (b.totalmsg || 0) - (a.totalmsg || 0))
			.slice(0, 10)
			.map(m => ({
				name: (m.username || m._id.split("@")[0]).slice(0, 22),
				messages: m.totalmsg || 0,
			}));

		// Message type aggregation
		const typeBreakdown = members.reduce(
			(acc, m) => {
				acc.text    += m.texttotal    || 0;
				acc.image   += m.imagetotal   || 0;
				acc.video   += m.videototal   || 0;
				acc.sticker += m.stickertotal || 0;
				acc.pdf     += m.pdftotal     || 0;
				return acc;
			},
			{ text: 0, image: 0, video: 0, sticker: 0, pdf: 0 }
		);

		const totalMessages  = Object.values(typeBreakdown).reduce((a, b) => a + b, 0);
		const activeGroups   = groups.filter(g => g.isBotOn).length;
		const blockedMembers = members.filter(m => m.isBlock).length;

		res.json({
			topGroups,
			topMembers,
			typeBreakdown,
			totalMessages,
			activeGroups,
			blockedMembers,
			totalGroups:  groups.length,
			totalMembers: members.length,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── API: Bot Health (new) ──────────────────────────────────────────────────────
router.get("/api/admin/bot/health", requireAdmin, (req, res) => {
	try {
		const mem = process.memoryUsage();
		res.json({
			uptime:      Math.floor(process.uptime()),
			memory: {
				heapUsed:  mem.heapUsed,
				heapTotal: mem.heapTotal,
				rss:       mem.rss,
				external:  mem.external,
			},
			connected:   !!req.app.locals.sock,
			nodeVersion: process.version,
			pid:         process.pid,
			platform:    process.platform,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── API: Broadcast (new) ───────────────────────────────────────────────────────
router.post("/api/admin/broadcast", requireAdmin, async (req, res) => {
	const { message, targetJids } = req.body;
	if (!message || !message.trim()) return res.status(400).json({ error: "Message is required." });

	const sock = req.app.locals.sock;
	if (!sock) return res.status(503).json({ error: "Bot is not connected. Cannot send messages." });

	try {
		// Resolve target JIDs
		let jids = targetJids;
		if (!Array.isArray(jids) || jids.length === 0) {
			const activeGroups = await group.find({ isBotOn: true }, { projection: { _id: 1 } }).toArray();
			jids = activeGroups.map(g => g._id);
		}

		let sent = 0, failed = 0;
		for (const jid of jids) {
			try {
				await sock.sendMessage(jid, { text: message.trim() });
				sent++;
				// Small delay to avoid rate limiting
				await new Promise(r => setTimeout(r, 400));
			} catch (_) {
				failed++;
			}
		}

		res.json({ ok: true, sent, failed, total: jids.length });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── API: Reconnect — creates a fresh socket without restarting the process ────
// Use this after logout or clear-auth so the bot gets a new QR/pairing code.
router.post("/api/admin/reconnect", requireAdmin, async (req, res) => {
	try {
		const reconnect = req.app.locals.reconnect;
		if (!reconnect) return res.status(503).json({ error: "Reconnect function not available." });

		// Fire and don't await — startSock is async and the QR/connect events
		// will be broadcast via WebSocket once the new socket is ready.
		reconnect();

		res.json({ ok: true, message: "Reconnecting… watch the QR page for the new QR code or use the pairing code." });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── API: Restart the Node process (full restart) ───────────────────────────────
// Only needed if reconnect alone isn't enough (e.g. memory issues).
// Spawns a new copy of this process then exits the current one.
router.post("/api/admin/restart", requireAdmin, (req, res) => {
	res.json({ ok: true, message: "Process restarting…" });
	setTimeout(async () => {
		const { spawn } = await import("child_process");
		const child = spawn(process.execPath, process.argv.slice(1), {
			cwd: process.cwd(), env: process.env, stdio: "inherit", detached: true,
		});
		child.unref();
		process.exit(0);
	}, 600);
});

// ── API: Logout bot from WhatsApp (new) ───────────────────────────────────────
router.post("/api/admin/logout-bot", requireAdmin, async (req, res) => {
	const sock = req.app.locals.sock;
	if (!sock) return res.status(503).json({ error: "Bot is not connected." });
	try {
		await sock.logout("Admin logout via dashboard");
		req.app.locals.sock = null;
		res.json({ ok: true, message: "Bot logged out of WhatsApp. Restart the bot to reconnect." });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── API: Pairing code (admin dashboard - requires auth) ───────────────────────
router.post("/api/admin/request-pair", requireAdmin, async (req, res) => {
	const { phoneNumber } = req.body;
	if (!phoneNumber) return res.status(400).json({ error: "Phone number is required." });

	const sock = req.app.locals.sock;
	if (!sock) return res.status(503).json({ error: "Bot socket is not ready." });

	if (sock.authState?.creds?.registered) {
		return res.status(400).json({ error: "Bot is already logged in. Clear auth first, then restart the bot." });
	}

	try {
		// Strip everything except digits
		const clean = phoneNumber.replace(/\D/g, "");
		if (clean.length < 7) return res.status(400).json({ error: "Invalid phone number." });

		const code = await sock.requestPairingCode(clean);
		res.json({ ok: true, code });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── API: Clear auth database (new) ────────────────────────────────────────────
router.post("/api/admin/clear-auth", requireAdmin, async (req, res) => {
	try {
		const authCollection = mdClient.db("MyBotDataDB").collection("AuthState");
		const result = await authCollection.deleteMany({});
		res.json({ ok: true, deleted: result.deletedCount, message: "Auth cleared. Restart the bot to get a new QR code or pairing code." });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── API: Commands ──────────────────────────────────────────────────────────────
router.get("/api/admin/commands", requireAdmin, async (req, res) => {
	try {
		const [cmds, botData] = await Promise.all([cmdToText(), getBotData()]);
		const disabled = botData?.disabledGlobally || [];
		const annotate = (list, type) =>
			list.map((c) => ({ ...c, type, disabledGlobally: c.cmd.some((k) => disabled.includes(k)) }));
		res.json({
			publicCommands: annotate(cmds.publicCommands, "public"),
			groupCommands:  annotate(cmds.groupCommands,  "group"),
			adminCommands:  annotate(cmds.adminCommands,  "admin"),
			ownerCommands:  annotate(cmds.ownerCommands,  "owner"),
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.patch("/api/admin/commands/:cmd", requireAdmin, async (req, res) => {
	const { disabled, aliases = [] } = req.body;
	const primary = decodeURIComponent(req.params.cmd);
	const allKeys = [...new Set([primary, ...aliases])];
	try {
		if (disabled) {
			await bot.updateOne(
				{ _id: "bot" },
				{ $setOnInsert: { youtube_session: "" }, $addToSet: { disabledGlobally: { $each: allKeys } } },
				{ upsert: true }
			);
		} else {
			await bot.updateOne({ _id: "bot" }, { $pullAll: { disabledGlobally: allKeys } });
		}
		res.json({ ok: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── API: Groups ────────────────────────────────────────────────────────────────
router.get("/api/admin/groups", requireAdmin, async (req, res) => {
	try {
		const groups = await group.find({}, { projection: { chatHistory: 0 } }).toArray();
		res.json(groups);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.patch("/api/admin/groups/:jid", requireAdmin, async (req, res) => {
	const jid = decodeURIComponent(req.params.jid);
	const allowed = ["isBotOn", "isChatBotOn", "isImgOn", "is91Only", "isAutoStickerOn", "cmdBlocked"];
	const update = {};
	for (const key of allowed) {
		if (key in req.body) update[key] = req.body[key];
	}
	if (!Object.keys(update).length) return res.status(400).json({ error: "No valid fields" });
	try {
		await group.updateOne({ _id: jid }, { $set: update });
		res.json({ ok: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.get("/api/admin/groups/:jid/members", requireAdmin, async (req, res) => {
	const jid = decodeURIComponent(req.params.jid);
	try {
		const grp = await group.findOne({ _id: jid }, { projection: { members: 1 } });
		res.json(grp?.members || []);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// ── API: Members ───────────────────────────────────────────────────────────────
router.get("/api/admin/members", requireAdmin, async (req, res) => {
	const { search = "", page = 1, limit = 50, sort = "totalmsg", order = "desc" } = req.query;
	const skip = (parseInt(page) - 1) * parseInt(limit);
	const query = search
		? { $or: [{ _id: { $regex: search, $options: "i" } }, { username: { $regex: search, $options: "i" } }] }
		: {};
	const allowedSort = ["totalmsg", "texttotal", "imagetotal", "videototal", "stickertotal", "pdftotal", "username"];
	const sortField = allowedSort.includes(sort) ? sort : "totalmsg";
	const sortDir = order === "asc" ? 1 : -1;
	try {
		const [members, total] = await Promise.all([
			member.find(query).sort({ [sortField]: sortDir }).skip(skip).limit(parseInt(limit)).toArray(),
			member.countDocuments(query),
		]);
		res.json({ members, total, page: parseInt(page), limit: parseInt(limit) });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.patch("/api/admin/members/:jid", requireAdmin, async (req, res) => {
	const jid = decodeURIComponent(req.params.jid);
	const { action } = req.body;
	try {
		if (action === "block") {
			await member.updateOne({ _id: jid }, { $set: { isBlock: true } });
		} else if (action === "unblock") {
			await member.updateOne({ _id: jid }, { $set: { isBlock: false } });
		} else if (action === "resetWarnings") {
			await member.updateOne({ _id: jid }, { $set: { warning: [] } });
		} else if (action === "resetMsgCount") {
			await member.updateOne({ _id: jid }, {
				$set: { totalmsg: 0, texttotal: 0, imagetotal: 0, videototal: 0, stickertotal: 0, pdftotal: 0 },
			});
		} else {
			return res.status(400).json({ error: "Unknown action" });
		}
		res.json({ ok: true });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
