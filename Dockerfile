FROM node:22-slim

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

RUN wget -q https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -O /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

ENV YTDL_EXTRACTOR_ARGS="youtube:player_client=default,web"

# ── pnpm ─────────────────────────────────────────────────────────────────────
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY dashboard/package.json dashboard/package-lock.json* ./dashboard/
RUN npm install --prefix dashboard --include=dev --no-audit

COPY . .

RUN cd dashboard && npm run build

RUN mkdir -p temp

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "index.js"]
