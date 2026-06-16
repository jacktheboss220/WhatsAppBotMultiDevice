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

ENV YTDLP_PATH=/usr/local/bin/yt-dlp
ENV FFMPEG_PATH=ffmpeg

RUN corepack enable && corepack prepare pnpm@11.5.0 --activate

WORKDIR /app

# Copy manifests for all workspace members before install (better layer caching)
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY dashboard/package.json ./dashboard/
RUN pnpm install

# Copy full source and build dashboard
COPY . .
RUN cd dashboard && pnpm run build

RUN mkdir -p temp

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "index.js"]
