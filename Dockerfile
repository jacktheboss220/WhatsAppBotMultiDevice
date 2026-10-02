FROM oven/bun:1-slim

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

# Bust the Docker cache whenever a new yt-dlp release ships. Without this, the RUN
# layer below stays cached across rebuilds and yt-dlp freezes at its first-built
# version — which modern YouTube rejects ("Requested format is not available").
ADD https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest /tmp/yt-dlp-latest.json
RUN wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -O /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

ENV YTDLP_PATH=/usr/local/bin/yt-dlp
ENV FFMPEG_PATH=ffmpeg

WORKDIR /app

# Copy manifests for all workspace members before install (better layer caching)
COPY package.json bun.lock* ./
COPY dashboard/package.json ./dashboard/
RUN bun install --frozen-lockfile

# Copy full source and build dashboard
COPY . .
RUN bun run --cwd dashboard build

RUN mkdir -p temp && chown -R bun:bun /app/temp

ENV NODE_ENV=production

EXPOSE 8080

# Start as root only to fix ownership of the (possibly root-owned, pre-existing) temp volume, then drop to the
# unprivileged "bun" user. If setpriv is missing it falls back to running as root instead of failing to start.
CMD ["sh", "-c", "chown -R bun:bun /app/temp 2>/dev/null; if command -v setpriv >/dev/null 2>&1; then exec setpriv --reuid=bun --regid=bun --init-groups env HOME=/home/bun bun --smol index.js; else echo \"setpriv not found - running as root\"; exec bun --smol index.js; fi"]
