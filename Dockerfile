FROM node:22-slim

# ── System dependencies ───────────────────────────────────────────────────────
# canvas (image gen), ffmpeg (media), webp (stickers), yt-dlp (YouTube)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ffmpeg \
    webp \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# yt-dlp (more reliable YouTube downloader)
RUN wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -O /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

ENV YTDL_EXTRACTOR_ARGS="youtube:player_client=default,web"
ENV FFMPEG_PATH=ffmpeg

# ── pnpm ─────────────────────────────────────────────────────────────────────
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# ── 1. Install bot server dependencies ───────────────────────────────────────
# Copy manifest first so this layer is cached unless package.json changes.
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ── 2. Install React dashboard dependencies (including devDependencies) ───────
# --include=dev is required because vite is a devDependency.
# NODE_ENV must NOT be production here or npm silently skips devDeps.
COPY dashboard/package.json dashboard/package-lock.json* ./dashboard/
RUN npm install --prefix dashboard --include=dev --no-audit

# ── 3. Copy all source files ──────────────────────────────────────────────────
COPY . .

# ── 4. Build the React dashboard ──────────────────────────────────────────────
# Must cd into the dashboard directory — npm --prefix only changes the install
# location, NOT the working directory for scripts, so vite can't find index.html
# when run from /app. Running from /app/dashboard fixes that.
RUN cd dashboard && npm run build

# ── 5. Runtime setup ──────────────────────────────────────────────────────────
RUN mkdir -p temp

# Set production mode AFTER the build so devDeps were available during build.
ENV NODE_ENV=production

# Koyeb injects PORT at runtime; the app reads process.env.PORT || 8000.
EXPOSE 8000

CMD ["node", "index.js"]
