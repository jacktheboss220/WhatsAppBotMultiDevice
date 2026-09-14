#!/usr/bin/env bash
# WhatsApp bot — Docker build/run/monitor helper.
# Usage: ./build.sh <command>
#   ./build.sh up          build + start detached
#   ./build.sh logs        tail logs (Ctrl-C to exit, container keeps running)
#   ./build.sh monitor     live CPU/mem/net stats
set -euo pipefail

cd "$(dirname "$0")"

# Use "docker compose" (v2) if present, else fall back to "docker-compose".
if docker compose version >/dev/null 2>&1; then DC="docker compose"; else DC="docker-compose"; fi
SVC="whatsapp-bot"          # service name in docker-compose.yml
CTR="whatsapp-bot"          # container_name in docker-compose.yml

usage() {
    grep -E '^\s+[a-z-]+\)' "$0" | sed -E 's/\)//; s/^/  /' || true
    cat <<'EOF'
Commands:
  build      build image (no cache-bust beyond Dockerfile's yt-dlp ADD)
  rebuild    build with --no-cache (full clean rebuild)
  up         build + start detached
  down       stop + remove containers
  start      start an existing stopped container (no rebuild)
  stop       stop the running container (keeps it for later start)
  restart    restart the bot container
  logs       follow logs (last 200 lines)
  monitor    live resource stats (docker stats)
  ps         show container status
  health     curl the /health endpoint
  shell      open bash inside the running container
  update     git pull + rebuild + restart
  ytdlp      update yt-dlp inside the running container
  prune      remove dangling images/build cache (frees disk)
  env        sanity-check required .env vars are set
  nginx      install + configure Nginx reverse proxy (host, needs sudo)
  ssl        obtain/renew Let's Encrypt cert via certbot (host, needs sudo)
EOF
}

# Domain + email for Nginx/SSL. Set inline: DOMAIN=your.domain.com EMAIL=you@mail.com ./build.sh nginx
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"

require_env() {
    [ -f .env ] || { echo "ERROR: .env missing. cp .env.example .env"; exit 1; }
}

case "${1:-help}" in
    build)
        require_env; $DC build ;;
    rebuild)
        require_env; $DC build --no-cache ;;
    up)
        require_env; $DC up -d --build && echo "Started. Scan QR: ./build.sh logs" ;;
    down)
        $DC down ;;
    start)
        $DC start "$SVC" && echo "Container started (no rebuild)." ;;
    stop)
        $DC stop "$SVC" && echo "Container stopped (not removed)." ;;
    restart)
        $DC restart "$SVC" ;;
    logs)
        $DC logs -f --tail=200 "$SVC" ;;
    monitor)
        docker stats "$CTR" ;;
    ps)
        $DC ps ;;
    health)
        PORT="$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2)"; PORT="${PORT:-8080}"
        curl -fsS "http://localhost:${PORT}/health" && echo "  ✓ healthy" || echo "  ✗ no response" ;;
    shell)
        docker exec -it "$CTR" bash ;;
    update)
        require_env
        git pull
        $DC up -d --build
        echo "Updated + restarted." ;;
    ytdlp)
        docker exec "$CTR" yt-dlp -U && echo "yt-dlp updated in container." ;;
    prune)
        docker image prune -f && docker builder prune -f ;;
    nginx)
        # Installs Nginx, drops the conf with the right domain, enables it.
        command -v nginx >/dev/null 2>&1 || { sudo apt-get update && sudo apt-get install -y nginx; }
        sudo cp deploy/nginx/wabot.conf /etc/nginx/sites-available/wabot.conf
        sudo sed -i "s/your-domain\.example\.com/${DOMAIN}/g" /etc/nginx/sites-available/wabot.conf
        sudo ln -sf /etc/nginx/sites-available/wabot.conf /etc/nginx/sites-enabled/wabot.conf
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl reload nginx
        echo "Nginx configured for ${DOMAIN}. Now run: ./build.sh ssl" ;;
    ssl)
        [ -n "$EMAIL" ] || { echo "Set EMAIL: EMAIL=you@mail.com ./build.sh ssl"; exit 1; }
        command -v certbot >/dev/null 2>&1 || sudo apt-get install -y certbot python3-certbot-nginx
        sudo certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect
        echo "SSL live for https://${DOMAIN}" ;;
    env)
        require_env
        miss=0
        for v in MY_NUMBER BOT_NUMBER MONGODB_KEY PREFIX SESSION_SECRET; do
            val="$(grep -E "^${v}=" .env | cut -d= -f2-)"
            if [ -z "$val" ]; then echo "  ✗ $v  (REQUIRED, empty)"; miss=1; else echo "  ✓ $v"; fi
        done
        [ "$miss" -eq 0 ] && echo "All required vars set." || { echo "Fill missing vars in .env"; exit 1; } ;;
    help|-h|--help)
        usage ;;
    *)
        echo "Unknown command: $1"; usage; exit 1 ;;
esac