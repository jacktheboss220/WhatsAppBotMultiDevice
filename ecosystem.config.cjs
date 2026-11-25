// pm2 process file: `pm2 start ecosystem.config.cjs`
module.exports = {
  apps: [
    {
      name: "eva-bot",
      script: "index.js",
      // Same runtime the bot is run with by hand; .env is loaded from this directory.
      cwd: __dirname,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 20,
      env: {
        // yt-dlp reads Brave's cookie key (YTDLP_COOKIES_BROWSER=brave+gnomekeyring) over the user
        // D-Bus; a pm2 daemon started at boot has no session bus, so point it at the user's.
        DBUS_SESSION_BUS_ADDRESS: `unix:path=/run/user/${process.getuid()}/bus`,
      },
    },
  ],
};
