[![Buy Me a Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&slug=jacktheboss220&button_colour=BD5FFF&font_colour=ffffff&outline_colour=000000&coffee_colour=FFDD00)](https://www.buymeacoffee.com/jacktheboss220)

# WhatsAppBotMultiDevice

![License](https://img.shields.io/badge/license-MIT-blue) ![Runtime](https://img.shields.io/badge/runtime-Bun-black) ![Lint](https://img.shields.io/badge/lint-oxlint-brightgreen)

A multi-device WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys) (7.0.0-rc), running on [Bun](https://bun.sh). It downloads media, makes stickers, searches the web, chats with an AI assistant (Eva, powered by Gemini), tracks group activity and ranks, and ships with an admin dashboard for managing it all.

## Features

- **Commands** for everyday use: stickers, YouTube / Instagram / Twitter / Reddit downloads, lyrics, translation, weather, reminders, Wikipedia, memes and more (full list below).
- **Eva**: a Gemini-powered group assistant that can chat and summarise the group's history.
- **Group tools**: welcome messages, rules, warnings, rank / XP, message counts, per-group feature toggles and command blocking.
- **Admin dashboard** (React + Vite) at `/admin`: status, QR pairing, groups, members, analytics, command stats, logs, broadcast and direct messages. Login is by admin password or Google OAuth.
- **Performance**: MongoDB-backed auth state and data, layered in-memory + Redis caches (group metadata, user devices), and a rate-limited send queue.
- **Owner tooling**: `clearcache`, `stats`, `broadcast`, `toggle`, DB control and more.

## Quick start

1. Set up the [environment](#environment-variables), at minimum `MONGODB_KEY`, `MY_NUMBER`, `BOT_NUMBER`, `PREFIX`, `ADMIN_PASSWORD` and `SESSION_SECRET`.
2. Start the bot (locally or with Docker, below).
3. Open the web page (`http://localhost:8000`) and scan the QR code with the WhatsApp account the bot should use (_Linked devices > Link a device_). The session is stored in MongoDB, so you only pair once.
4. Send `-help` from your `MY_NUMBER` account to check it replies, then `-owner` for the owner commands.

## Requirements

- [Bun](https://bun.sh) 1.x
- MongoDB (`MONGODB_KEY`)
- ffmpeg (`FFMPEG_PATH`, or the bundled `ffmpeg-static`)
- yt-dlp for YouTube downloads (`YTDLP_PATH`; the Docker image installs it)
- Optional: Redis for persistent caches (`USE_REDIS=true`)

## Run locally

```sh
cp .env.example .env     # then fill in the values (see below)
bun install
bun run build            # builds the dashboard
bun start                # or: bun run start:dev / start:production
```

Open `http://localhost:8000` (or your `PORT`) and pair the bot by scanning the QR code. The dashboard lives at `/admin`; `/health` is the liveness probe.

Other scripts: `bun run lint`, `bun run lint:fix`, `bun run fmt`, `bun run fmt:check`. Maintenance scripts (DB backup, auth-state cleanup, LID migration) are in `scripts/`.

### Dashboard development

```sh
bun run --cwd dashboard dev    # http://localhost:5173, proxies /api to localhost:8000
bun run build                  # production build into public/app, served at /admin
```

Run the bot (`bun start`) alongside the Vite dev server.

## Environment variables

Copy `.env.example` to `.env`. Never commit it.

| Variable                                                              | Purpose                                                               |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `PREFIX`                                                              | Command prefix, e.g. `-`                                              |
| `MY_NUMBER`                                                           | Owner number (unlocks owner commands)                                 |
| `MODERATORS`                                                          | Extra moderator numbers                                               |
| `BOT_NUMBER`                                                          | Number the bot runs on                                                |
| `MONGODB_KEY`                                                         | MongoDB connection string ([mongodb.com](https://www.mongodb.com/))   |
| `GOOGLE_API_KEY`                                                      | Gemini key for Eva                                                    |
| `GOOGLE_API_KEY_SEARCH`, `SEARCH_ENGINE_KEY`                          | Google Custom Search (`img`, `search`)                                |
| `REMOVE_BG_KEY`                                                       | [remove.bg](https://www.remove.bg/api) (`removebg`)                   |
| `GENIUS_ACCESS_SECRET`                                                | [Genius](https://docs.genius.com/) (`lyric`)                          |
| `YTDLP_PATH`, `YTDLP_COOKIES`                                         | yt-dlp binary and optional cookies.txt for sign-in / age checks       |
| `FFMPEG_PATH`                                                         | ffmpeg binary (blank = bundled)                                       |
| `ADMIN_PASSWORD`, `SESSION_SECRET`                                    | Dashboard login and session signing                                   |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_ALLOWED_EMAILS`   | Optional Google OAuth login for the dashboard                         |
| `USE_REDIS`, `REDIS_URL` _or_ `REDIS_HOST/PORT/USERNAME/PASSWORD/TLS` | Optional Redis caches (`rediss://` URLs enable TLS)                   |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`                              | Optional Telegram log notifications                                   |
| `CORS_ORIGINS`                                                        | Extra allowed browser origins (comma-separated); usually empty        |
| `ENABLE_EVAL`                                                         | `true` enables the owner-only `test` command. Leave off in production |
| `PORT`, `HOST_URL`                                                    | HTTP port (default 8000) and public URL                               |

## Deploy with Docker

```sh
cp .env.example .env
./build.sh up            # build + start detached
```

`build.sh` wraps the common tasks: `logs`, `restart`, `update` (git pull + rebuild), `ytdlp` (update yt-dlp in the container), `health`, `env` (check required vars), `nginx` and `ssl` (reverse proxy + Let's Encrypt, config in `deploy/nginx/`). Run `./build.sh` with no arguments for the full list.

The container listens on `127.0.0.1:${PORT:-8080}` only; put Nginx (or another TLS proxy) in front of it.

## Project structure

```
index.js          Express server, dashboard + API, boot
connection.js     WhatsApp socket startup and reconnects
core/             Baileys events: messages, group events, calls, connection, auth
commands/         One file per command, split by who may use it
  public/  group/members/  group/admins/  owner/
cache/            In-memory + Redis caches (group metadata, user devices)
queue/            Rate-limited outgoing message queue
db/               MongoDB access (members, groups, reminders, stats)
routes/           Dashboard / admin REST API
dashboard/        React + Vite admin UI (builds to public/app)
utils/            Command loader, roles, LID helpers, yt-dlp, safe fetch, ...
notify/           Admin event stream, Telegram and owner notifications
scripts/          Maintenance scripts (see below)
deploy/nginx/     Reverse-proxy config used by ./build.sh
```

An incoming message goes through `core/messages.js`, which resolves the sender's role, checks blocks and group feature toggles, finds the command via `utils/commandLoader.js`, and calls its handler. Replies are sent through `queue/` to stay within WhatsApp's rate limits.

## Adding a command

Create a file in the folder matching who may use it (`commands/public`, `group/members`, `group/admins` or `owner`). It is loaded automatically at startup.

```js
const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping } = msgInfoObj;
  return sendMessageWTyping(from, { text: `pong ${args.join(" ")}` }, { quoted: msg });
};

export default () => ({
  cmd: ["ping2", "p2"], // name and aliases
  desc: "Reply with pong.", // shown in help
  usage: "ping2 <text>",
  handler,
});
```

`msgInfoObj` carries the prefix, sender JID, `isGroup`, the text after the command (`evv`), quoted-message info and send helpers. Look at a similar existing command for the fields you need. Before opening a PR, run `bun run lint` and `bun run fmt:check`.

## Commands

Send `help` (or `menu`) in chat for the live list, or `help <command>` for details. Examples use a `-` prefix.

### Public

| Command                 | What it does                                           | Example                    |
| ----------------------- | ------------------------------------------------------ | -------------------------- |
| `alive` / `ping`        | Check the bot is online                                | `-alive`                   |
| `help` / `menu`         | Show the menu or one command's details                 | `-help sticker`            |
| `eva` / `gemini`        | Chat with the AI assistant                             | `-eva summarise today`     |
| `sticker` / `s`         | Image or video to sticker (pack, author, crop options) | `-s pack MyPack author Me` |
| `steal` / `stealn`      | Copy a sticker into your own pack                      | `-steal`                   |
| `sets` / `stealText`    | Set your default pack and author for `steal`           | `-sets MyPack`             |
| `attp`                  | Text to sticker                                        | `-attp hello`              |
| `say` / `tts`           | Text to voice message (English or Hindi)               | `-say hin नमस्ते`            |
| `tr` / `translate`      | Translate text                                         | `-tr hi good morning`      |
| `calc`                  | Solve a math expression                                | `-calc 2*(3+4)`            |
| `weather` / `w`         | Current weather for a city                             | `-weather Delhi`           |
| `wiki`                  | Short Wikipedia summary                                | `-wiki Alan Turing`        |
| `search` / `gs`         | Google search                                          | `-search bun runtime`      |
| `remind` / `reminder`   | Reminders up to 1 week, optional repeat (IST)          | `-remind 2h call mom`      |
| `rank` / `level` / `xp` | Your rank and XP in the group                          | `-rank @user`              |
| `reddit`                | Download a Reddit post                                 | `-reddit <link>`           |
| `idp` / `dp`            | Instagram profile picture                              | `-idp username`            |
| `epicgames`             | Current free games on Epic                             | `-epicgames`               |
| `delete` / `d`          | Delete a bot message (reply to it)                     | `-delete`                  |
| `donate`, `dev`         | Support / developer info                               | `-donate`                  |

### Group members

| Command                                                          | What it does                                              |
| ---------------------------------------------------------------- | --------------------------------------------------------- |
| `yt` / `ytv`, `yta`                                              | Download a YouTube video / its audio                      |
| `song` / `play`                                                  | Download a song by name                                   |
| `insta` / `i`, `twitter` / `x`                                   | Download Instagram / Twitter posts                        |
| `lyric` / `l`                                                    | Song lyrics                                               |
| `mp3` / `tomp3`                                                  | Video to MP3 (reply to the video)                         |
| `image` / `toimg`, `togif`                                       | Sticker to image / GIF                                    |
| `removebg` / `bg`                                                | Remove an image background                                |
| `text` / `txt`                                                   | Add top/bottom text to an image                           |
| `img`                                                            | Google Images search                                      |
| `meme`, `joke`, `fact`, `advice`, `quote`, `proquote`, `qpoetry` | Fun content                                               |
| `news`, `horo`, `ud`, `dict`, `gender`, `love`, `un`             | News, horoscope, dictionaries, name tools, Udemy freebies |
| `rules`, `getwarn`                                               | Group rules / a member's warnings                         |
| `mycount`, `totalg`                                              | Your message counts                                       |

### Group admins

| Command                          | What it does                           |
| -------------------------------- | -------------------------------------- |
| `admin`                          | List admin commands                    |
| `add`, `remove` / `kick`         | Add or remove a member                 |
| `promote`, `demote`              | Grant or revoke admin                  |
| `warn`, `unwarn`                 | Manage warnings                        |
| `setname`, `link`, `chat on/off` | Group name, invite link, lock chat     |
| `welcome`, `setrules`            | Welcome message and rules              |
| `tagall`, `rn`                   | Mention everyone / one random member   |
| `count`, `zero`                  | Member message statistics              |
| `blockc`                         | Block or unblock commands in the group |
| `ranknotif`                      | Toggle rank-up notifications           |

### Owner

`owner` lists everything. Highlights: `broadcast`, `hidetag`, `block` / `unblock`, `toggle` (per-group features), `stats`, `clearcache` (flush group metadata and device caches, memory + Redis), `clearhistory` / `evainfo` (Eva memory), `group` / `member` / `bot` (DB records), `jid` / `lid`, `removebot`, and `test` (eval, disabled unless `ENABLE_EVAL=true`).

## Scripts

Run with `bun scripts/<name>.js` (they use the same `.env`).

| Script              | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `backupDb.js`       | Export the bot's MongoDB collections to a local `backups/` dir |
| `viewAuthStats.js`  | Show stats about the stored WhatsApp auth state                |
| `clearAuthState.js` | Wipe the stored session to force a fresh QR pairing            |
| `migrateLIDs.js`    | Migrate member records to WhatsApp's LID addressing            |

## Troubleshooting

| Symptom                                            | Fix                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| YouTube: "Sign in to confirm" / format unavailable | Update yt-dlp (`./build.sh ytdlp`) and set `YTDLP_COOKIES` to a logged-in `cookies.txt`          |
| Messages to a group fail with `not-acceptable`     | Stale group metadata. Send `-clearcache` (owner) and retry                                       |
| Redis connection errors                            | Check `REDIS_URL` / host settings, or set `USE_REDIS=false`. The bot falls back to memory caches |
| QR page never pairs / stuck session                | `bun scripts/clearAuthState.js`, restart, scan again                                             |
| Commands ignored for you                           | Check `PREFIX`, and that `MY_NUMBER` / `MODERATORS` include the country code                     |
| Stickers or audio conversion fail                  | Make sure ffmpeg is installed or set `FFMPEG_PATH`                                               |
| Dashboard login rejected                           | Verify `ADMIN_PASSWORD`; for Google login the email must be in `GOOGLE_ALLOWED_EMAILS`           |

## Security notes

- Keep `.env` out of version control and use a long random `SESSION_SECRET`.
- Leave `ENABLE_EVAL` unset in production: the `test` command runs arbitrary code with full server access.
- Leave `CORS_ORIGINS` empty unless another site must call the API; the dashboard is same-origin.
- Serve the dashboard over HTTPS (`./build.sh ssl`) and keep the container bound to localhost.
- This bot automates a WhatsApp account through an unofficial API. That can violate WhatsApp's terms and the account may be banned, so use a dedicated number, not your personal one.

## Deploy on Koyeb

Koyeb builds the repo's `Dockerfile`, which already includes Bun, ffmpeg and yt-dlp.

1. Create an account at [koyeb.com](https://app.koyeb.com/auth/signup) and create a new app.
2. Choose **GitHub** as the source and select this repo.
3. Set the builder to **Dockerfile**. No build or run command is needed, the image starts the bot itself.
4. Add the [environment variables](#environment-variables) as secrets. Set `PORT=8080` and expose port `8080` as an HTTP service.
5. Set the health check to HTTP `GET /health`.
6. Deploy, then open the app URL and scan the QR code.

Koyeb's disk is ephemeral. That is fine here because the session and data live in MongoDB, but you do need `MONGODB_KEY`.

## Deploy on Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/jacktheboss220/WhatsAppBotMultiDevice)

The button uses `app.json` and `Procfile` and asks for the required config vars. Heroku's default Node.js buildpack does not include Bun, but `npm start` runs `bun index.js`, so on the buildpack path you must add a Bun buildpack, or deploy as a container instead:

```sh
heroku stack:set container -a <app-name>
```

and add a `heroku.yml` that builds the `Dockerfile` (`build: docker: web: Dockerfile`). Heroku's filesystem is ephemeral and dynos restart daily, so MongoDB must hold the session. These Heroku files are older than the Docker setup; if the button fails, use Koyeb or Docker.

## Contributing

Issues and pull requests are welcome. Keep changes focused, run `bun run lint` and `bun run fmt:check`, and describe how you tested.

## License

MIT, see [LICENSE](LICENSE).

## References

- [Baileys](https://github.com/WhiskeySockets/Baileys)

If you enjoy this project, please consider giving it a :star: on GitHub.
