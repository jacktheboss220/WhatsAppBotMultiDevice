[![Buy Me a Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&slug=jacktheboss220&button_colour=BD5FFF&font_colour=ffffff&outline_colour=000000&coffee_colour=FFDD00)](https://www.buymeacoffee.com/jacktheboss220)

# WhatsAppBotMultiDevice

A feature-rich WhatsApp bot with a modern React/Vite admin dashboard. Supports downloading songs, getting lyrics, creating stickers, memes, image search, media conversion, news, horoscopes, and much more — all controllable from a sleek web UI.

## Table of Contents

- [Commands List](#commands-list)
- [Running Locally](#running-the-whatsapp-bot-locally)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Running the Dashboard (Dev Mode)](#running-the-dashboard-in-dev-mode)
  - [WhatsApp Login via Pairing Code](#whatsapp-login-via-pairing-code)
  - [Enabling the Bot in Groups](#enabling-bot-in-groups)
- [Deploy on Koyeb](#deploy-on-koyebcom)
- [Deploy on Heroku](#deploy-on-heroku)
- [Environment Variables](#environment-variables)
- [References](#references)

---

## Commands List

| **Group Commands**  |                      **Explanation**                      |              **Example**               | **Working/Not Working** |
| :-----------------: | :-------------------------------------------------------: | :------------------------------------: | :---------------------: |
|       -alive        |             Check if the bot is online or not             |                `-alive`                |            ✔            |
|       -admin        |                  List of admin commands                   |                `-admin`                |            ✔            |
|        -song        |                  Download a song by name                  |      `-song love me like you do`       |           ❌            |
|         -l          |                   Get lyrics for a song                   | `-l Main woh chaand by darshan raval`  |            ✔            |
|       -delete       |             Delete a message sent by the bot              |               `-delete`                |            ✔            |
|        -joke        |                     Get a random joke                     |                `-joke`                 |            ✔            |
|  -joke categories   |            Get a joke from a specific category            |          `-joke programming`           |            ✔            |
|        -meme        |                     Get a random meme                     |                `-meme`                 |            ✔            |
|       -movie        |              Get a download link for a movie              |           `-movie Avengers`            |           ❌            |
|       -anime        |        Get a quote from an anime character or show        |                `-anime`                |            ✔            |
|     -anime name     | Get a quote from an anime character with a specific name  |         `-anime name Saitama`          |            ✔            |
|    -anime title     |   Get a quote from an anime show with a specific title    |      `-anime title One Punch Man`      |            ✔            |
|      -sticker       |        Create a sticker from different media types        |   `-sticker pack myBitBot author MD`   |            ✔            |
|    -sticker crop    |                   Crop the sticker size                   |            `-sticker crop`             |            ✔            |
|   -sticker author   |                Add metadata to the sticker                |          `-sticker author MD`          |            ✔            |
|    -sticker pack    |                Add metadata to the sticker                |        `-sticker pack myBitBot`        |            ✔            |
| -sticker nometadata |           Remove all metadata from the sticker            |         `-sticker nometadata`          |            ✔            |
|       -steal        |          Send a sticker with the bot's metadata           |                `-steal`                |            ✔            |
|       -toimg        |               Convert a sticker to an image               |                `-toimg`                |            ✔            |
|       -image        |               Convert a sticker to an image               |                `-image`                |            ✔            |
|        -img         |             Search for an image using Google              |            `-img cute cat`             |            ✔            |
|        -mp3         |                 Convert a video to audio                  |                 `-mp3`                 |            ✔            |
|      -mp4audio      |                 Convert a video to audio                  |              `-mp4audio`               |            ✔            |
|       -tomp3        |                 Convert a video to audio                  |                `-tomp3`                |            ✔            |
|        -fact        |                     Get a random fact                     |                `-fact`                 |            ✔            |
|        -news        |                      Show tech news                       |                `-news`                 |            ✔            |
|  -news categories   |            Show news from a specific category             |             `-news sports`             |            ✔            |
|        -list        |            Show a list of categories for news             |                `-list`                 |            ✔            |
|        -idp         | Download the private profile picture of an Instagram user |            `-idp username`             |           ❌            |
|       -insta        |               Download media from Instagram               |          `-insta linkadress`           |            ✔            |
|       -gender       |            Get the gender percentage of a name            |          `-gender FirstName`           |            ✔            |
|         -yt         |       Download a YouTube video in the best quality        |           `-yt youtubelink`            |           ❌            |
|         -vs         |              Search for and download a video              |        `-vs khena galat galat`         |           ❌            |
|        -horo        |    Show your horoscope based on your astrological sign    |             `-horo pisces`             |            ✔            |
|       -advice       |             Get a random advice from the bot              |               `-advice`                |            ✔            |
|       -quote        |              Get a random quote from the bot              |                `-quote`                |            ✔            |
|        -proq        |           Get a programming quote from the bot            |                `-proq`                 |            ✔            |
|      -proquote      |           Get a programming quote from the bot            |              `-proquote`               |           ❌            |
|        -qpt         |              Get a poem written by an author              | `-qpt author Shakespeare title sonnet` |           ❌            |
|     -qpt author     |          Get a poem written by a specific author          |       `-qpt author Shakespeare`        |            ✔            |
|    -qpt authors     |              Get a list of authors for poems              |             `-qpt authors`             |            ✔            |
|      -qpoetry       |              Get a poem written by an author              |               `-qpoetry`               |            ✔            |
|      -removebg      |            Remove the background from an image            |              `-removebg`               |            ✔            |
|        -nsfw        |            Get the NSFW percentage of an image            |                `-nsfw`                 |           ❌            |
|        -tts         |                 Change text to a sticker                  |              `-tts text`               |            ✔            |
|        -text        |            Add a header and footer to an image            |       `-text TopText;BottomText`       |            ✔            |
|         -ud         |                Show the meaning of a name                 |              `-ud Mahesh`              |            ✔            |
|        -dic         |      Get the definition of a word from a dictionary       |              `-dic Love`               |            ✔            |
|      -txtmeme       |            Add a header and footer to an image            |     `-txtmeme TopText;BottomText`      |            ✔            |
|       -source       |                    Get the source code                    |               `-source`                |            ✔            |

<br>

| **Admin Commands** |             **Explanation**             |        **Example**        | **Working/Not Working** |
| :----------------: | :-------------------------------------: | :-----------------------: | :---------------------: |
|        -add        |      Add a new member to the group      |    `-add phone number`    |            ✔            |
|        -ban        |     Kick a member out of the group      |      `-ban @mention`      |            ✔            |
|      -promote      |   Give admin permissions to a member    |    `-promote @mention`    |            ✔            |
|      -demote       | Remove admin permissions from a member  |    `-demote @mention`     |            ✔            |
|      -rename       |       Change the group's subject        |   `-rename new-subject`   |            ✔            |
|      -welcome      |     Set the group's welcome message     |        `-welcome`         |            ✔            |
|       -chat        |      Enable or disable group chat       | `-chat on` or `-chat off` |            ✔            |
|       -link        |          Get the group's link           |          `-link`          |            ✔            |
|       -warn        |       Give a warning to a member        |     `-warn @mention`      |            ✔            |
|      -unwarn       |     Remove a warning from a member      |    `-unwarn @mention`     |            ✔            |
|      -tagall       | Send an attendance alert to all members |     `-tagall message`     |            ✔            |

---

# Running the WhatsApp Bot Locally

## Prerequisites

- **Node.js** 22.x
- **pnpm** 9.x (`npm install -g pnpm`)
- **MongoDB** — a free cluster on [mongodb.com](https://www.mongodb.com) works fine
- **Git**

## Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/jacktheboss220/WhatsAppBotMultiDevice.git
   cd WhatsAppBotMultiDevice
   ```

2. **Create a `.env` file** in the project root (see [Environment Variables](#environment-variables) below for all keys).

   At minimum you need:

   ```env
   PREFIX=-
   MY_NUMBER=1234567890
   MODERATORS=1234567890
   MONGODB_KEY=mongodb+srv://user:pass@cluster.mongodb.net/db
   ADMIN_PASSWORD=your_admin_panel_password
   ```

3. **Install backend dependencies**

   ```bash
   pnpm install
   ```

4. **Build the React dashboard** (required for production / first run)

   ```bash
   pnpm run build
   ```

   This installs the dashboard dependencies and compiles the React/Vite app into `public/app/`.

5. **Start the bot**

   ```bash
   pnpm start
   ```

   The server starts on port **8000** (configurable via `PORT`).

---

## Running the Dashboard in Dev Mode

The dashboard (`dashboard/`) is a React + Vite app. During development you can run it with hot-reload alongside the backend:

1. Start the backend first:

   ```bash
   pnpm start
   ```

2. In a second terminal, start the Vite dev server:

   ```bash
   cd dashboard
   npm install   # only needed the first time
   npm run dev
   ```

   The dashboard is now available at **http://localhost:5173** and proxies all `/api` calls to the backend at `http://localhost:8000`.

3. For a production build (served by the backend at `/admin`):

   ```bash
   # from the project root
   pnpm run build
   ```

   After building, visit **http://localhost:8000/admin** to use the dashboard.

---

## WhatsApp Login via Pairing Code

The bot supports **pairing-code authentication** through the admin dashboard — no QR code scanning needed.

### Steps to authenticate

1. **Build the React dashboard** (only needed the first time, or after a `git pull`):

   ```bash
   pnpm run build
   ```

2. **Start the bot:**

   ```bash
   pnpm start
   ```

3. **Open the admin dashboard** in your browser and log in with your `ADMIN_PASSWORD`:

   ```
   http://localhost:8000/admin
   ```

4. Navigate to **Bot Health** in the sidebar.

5. Enter your WhatsApp phone number (with country code, digits only — e.g. `911234567890`) and click **Get Pairing Code**.

6. A **8-character pairing code** will appear on screen (e.g. `ABCD-1234`).

7. On your phone, open WhatsApp → **Settings** → **Linked Devices** → **Link a Device** → **Link with phone number instead**.

8. Enter the pairing code shown in the dashboard.

9. The bot will connect automatically and the dashboard will update to show the connected status.

> **Note:** Once the bot is already logged in, the pairing-code option is disabled. To re-authenticate, use the **Clear Auth** option in the admin panel and restart the bot.

---

## Enabling Bot in Groups

After the bot is connected, add it to a group and let a few messages go through — this causes the group to appear in the database. Then use **any one** of these methods to enable it:

### Method 1: Admin Dashboard (recommended)

1. Open the dashboard at `http://localhost:8000/admin` and log in.
2. Go to the **Groups** page in the sidebar.
3. Search for your group by name.
4. Toggle the **Bot Active** switch on the group card.

### Method 2: Owner command (in the group chat)

Send this message from the number set in `MY_NUMBER`:

```
group isBotOn:true
```

### Method 3: MongoDB directly

1. Open your MongoDB database.
2. Go to the **groups** collection.
3. Find the document for your group.
4. Set `isBotOn` to `true`.

---

# Deploy on Koyeb.com

1. Create an account at [https://app.koyeb.com/auth/signup](https://app.koyeb.com/auth/signup).
2. In the dashboard create a new app and connect your GitHub fork.
3. Set all required environment variables (see [Environment Variables](#environment-variables)).
4. Set the **build command** to `npm run build` and the **run command** to `node index.js`.
5. Deploy — Koyeb will build the React dashboard and start the bot automatically.

# Deploy on Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/jacktheboss220/WhatsAppBotMultiDevice)

The `app.json` and `Procfile` are already configured. Click the button above, fill in the environment variables, and deploy.

---

# Environment Variables

Create a `.env` file in the project root with the following keys.

## Required

| Variable         | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `PREFIX`         | Bot command prefix. Default: `-`                                          |
| `MY_NUMBER`      | Your WhatsApp number without `+` (owner number)                           |
| `BOT_NUMBER`     | The WhatsApp number the bot is logged in as (without `+`), used to filter self-messages. Can be the same as `MY_NUMBER` if you are self-hosting. |
| `MODERATORS`     | Comma-separated moderator numbers (e.g. `123,456`)                        |
| `MONGODB_KEY`    | MongoDB connection string from [mongodb.com](https://www.mongodb.com)     |
| `ADMIN_PASSWORD` | Password to log in to the React admin dashboard at `/admin`               |

## Optional

| Variable                | Description                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `PORT`                  | Server port (default: `8000`)                                                            |
| `NODE_ENV`              | `development` or `production`                                                            |
| `SESSION_SECRET`        | Secret used to sign the session cookie. Set a strong random string in production.        |
| `GOOGLE_API_KEY`        | Google/Gemini API key — used by the AI chatbot (`-chat`) and image generation commands   |
| `GOOGLE_API_KEY_SEARCH` | Google API key for the Custom Search API — used by the `-img` image search command       |
| `SEARCH_ENGINE_KEY`     | Google Custom Search Engine ID — required alongside `GOOGLE_API_KEY_SEARCH` for `-img`   |
| `GENIUS_ACCESS_SECRET`  | Genius API token — used by the `-l` lyrics command                                       |
| `PIN_KEY`               | Pinterest API key for Pinterest image search                                             |
| `REMOVE_BG_KEY`         | remove.bg API key — used by the `-removebg` command                                     |
| `TRUECALLER_ID`         | Truecaller API ID for caller identification                                              |
| `TWITTER_BEARER_TOKEN`  | Twitter/X API bearer token for Twitter-related features                                  |
| `FFMPEG_PATH`           | Path to a custom `ffmpeg` binary. If unset the bundled `ffmpeg-static` binary is used.  |
| `TELEGRAM_BOT_TOKEN`    | Telegram bot token — enables sending bot logs to a Telegram chat                         |
| `TELEGRAM_CHAT_ID`      | Telegram chat/channel ID to receive bot logs                                             |

## YouTube Download (Optional)

| Variable                            | Default  | Description                          |
| ----------------------------------- | -------- | ------------------------------------ |
| `YOUTUBE_DELAY_BETWEEN_REQUESTS`    | `1000`   | Delay between requests (ms)          |
| `YOUTUBE_MAX_RETRIES`               | `3`      | Maximum retry attempts               |
| `YOUTUBE_RETRY_DELAY`               | `2000`   | Delay between retries (ms)           |
| `MAX_AUDIO_SIZE_MB`                 | `50`     | Maximum audio file size (MB)         |
| `MAX_VIDEO_SIZE_MB`                 | `50`     | Maximum video file size (MB)         |
| `DOWNLOAD_TIMEOUT_SECONDS`          | `600`    | Download timeout (seconds)           |
| `YOUTUBE_DEBUG`                     | `false`  | Enable debug logging                 |
| `ENABLE_USER_AGENT_ROTATION`        | `true`   | Rotate user agents                   |
| `FORCE_DISABLE_YTDLP`               | `false`  | Force-disable yt-dlp                 |

## Example `.env` File

```env
# Required
PREFIX=-
MY_NUMBER=1234567890
BOT_NUMBER=1234567890
MODERATORS=1234567890,0987654321
MONGODB_KEY=mongodb+srv://username:password@cluster.mongodb.net/database
ADMIN_PASSWORD=supersecretpassword

# Optional
PORT=8000
NODE_ENV=production
SESSION_SECRET=change_this_to_a_random_string

# Google / Gemini — AI chatbot and image generation
GOOGLE_API_KEY=your_google_gemini_api_key_here

# Google Custom Search — required for -img image search command
GOOGLE_API_KEY_SEARCH=your_google_api_key_here
SEARCH_ENGINE_KEY=your_search_engine_id_here

# Other optional services
GENIUS_ACCESS_SECRET=your_genius_access_secret_here
PIN_KEY=your_pinterest_api_key_here
REMOVE_BG_KEY=your_remove_bg_key_here
TRUECALLER_ID=your_truecaller_id_here
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here

# Custom ffmpeg path (leave blank to use bundled ffmpeg-static)
# FFMPEG_PATH=/usr/bin/ffmpeg

# Telegram logging (optional — sends bot logs to a Telegram chat)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# YouTube Download Configuration
YOUTUBE_DELAY_BETWEEN_REQUESTS=1000
YOUTUBE_MAX_RETRIES=3
YOUTUBE_RETRY_DELAY=2000
MAX_AUDIO_SIZE_MB=50
MAX_VIDEO_SIZE_MB=50
DOWNLOAD_TIMEOUT_SECONDS=600
YOUTUBE_DEBUG=false
ENABLE_USER_AGENT_ROTATION=true
FORCE_DISABLE_YTDLP=false
```

---

# References

- [@Baileys](https://github.com/WhiskeySockets/Baileys)

If you enjoyed using this project, please consider giving it a :star: on GitHub. Your support is greatly appreciated! ❤️
