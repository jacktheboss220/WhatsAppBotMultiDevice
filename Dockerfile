FROM node:22-slim

# Install system dependencies including yt-dlp
RUN apt-get update && apt-get install -y \
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

# Install yt-dlp (YouTube downloader - more reliable than ytdl-core)
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    yt-dlp --version

# Set environment variable to use default player client (avoids JS runtime requirement)
ENV YTDL_EXTRACTOR_ARGS="youtube:player_client=default,web"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p temp

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]
