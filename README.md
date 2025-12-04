[![Buy Me a Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&slug=jacktheboss220&button_colour=BD5FFF&font_colour=ffffff&outline_colour=000000&coffee_colour=FFDD00)](https://www.buymeacoffee.com/jacktheboss220)

# WhatsAppBotMultiDevice 

Our WhatsApp bot project allows users to easily perform various actions such as downloading songs, getting lyrics, creating memes, and more. Some of the available commands include: downloading songs, getting lyrics, creating stickers, converting media types, searching for images, converting videos to audio, getting facts, showing news and horoscopes, getting quotes, and more. Additionally, users can download media from Instagram and Facebook, and get the gender percentage based on a name. Our bot also has a dictionary feature and can translate text to a specified language. Give it a try and see all that it can do!

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

# Deploy on Koyeb.com

To set up Koyeb for this project, follow these steps:

-   Create an account on Koyeb at https://app.koyeb.com/auth/signup.
-   Log in to the Koyeb dashboard and create a new app at https://app.koyeb.com/apps/new.
-   In the 'Deploy' section, choose your preferred deployment method (GitHub or Docker).
-   Set any necessary environment variables. All Required Env Are [Here](#evn)
-   Add the build and run commands: `npm i` and `node index.js`

# Deploy on Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/jacktheboss220/WhatsAppBotMultiDevice)

# Running the WhatsApp Bot Locally

To run this WhatsApp bot locally, create a `.env` file in the local directory and add the following key-value pairs:


## Required Keys

-   **PREFIX**: Enter your bot prefix. Default: `-` **(Required)**
-   **MY_NUMBER**: Enter your WhatsApp number without the plus sign. **(Required)**
-   **MODERATORS**: Comma-separated list of moderator numbers (number1,number2,number3). **(Required)**
-   **MONGODB_KEY**: Get your MongoDB connection string from [mongodb.com](https://www.mongodb.com). **(Required)**

## Optional Keys

-   **PORT**: Server port (default: 8000)
-   **NODE_ENV**: Environment mode (development/production)
-   **GOOGLE_API_KEY**: Get it from the [Google Developer Console](https://console.cloud.google.com)
-   **SEARCH_ENGINE_KEY**: Obtain it from the [Google Developer Console](https://console.cloud.google.com)
-   **OPENAI_API_KEY**: Your OpenAI API key for AI features
-   **GENIUS_ACCESS_SECRET**: Get it from [Genius.com](https://genius.com) for lyrics functionality
-   **PIN_KEY**: Pinterest API key for image search
-   **REMOVE_BG_KEY**: Obtain it from [remove.bg](https://www.remove.bg) for background removal
-   **TRUECALLER_ID**: Truecaller API for caller identification
-   **TWITTER_BEARER_TOKEN**: Twitter API bearer token
-   **HEROKU_API_TOKEN**: Required if deploying to Heroku
-   **HEROKU_APP_NAME**: Your Heroku app name

## YouTube Download Configuration (Optional)

-   **YOUTUBE_DELAY_BETWEEN_REQUESTS**: Delay between requests in milliseconds (default: 1000)
-   **YOUTUBE_MAX_RETRIES**: Maximum retry attempts (default: 3)
-   **YOUTUBE_RETRY_DELAY**: Delay between retries in milliseconds (default: 2000)
-   **MAX_AUDIO_SIZE_MB**: Maximum audio file size in MB (default: 50)
-   **MAX_VIDEO_SIZE_MB**: Maximum video file size in MB (default: 50)
-   **DOWNLOAD_TIMEOUT_SECONDS**: Download timeout in seconds (default: 600)
-   **YOUTUBE_DEBUG**: Enable debug mode (true/false, default: false)
-   **ENABLE_USER_AGENT_ROTATION**: Enable user agent rotation (true/false, default: true)
-   **FORCE_DISABLE_YTDLP**: Force disable yt-dlp (true/false, default: false)

## Example `.env` File

```env
# Required Environment Variables
PREFIX=-
MY_NUMBER=1234567890
MODERATORS=1234567890,0987654321
MONGODB_KEY=mongodb+srv://username:password@cluster.mongodb.net/database

# Optional Environment Variables
PORT=8000
NODE_ENV=production
GOOGLE_API_KEY=your_google_api_key_here
SEARCH_ENGINE_KEY=your_search_engine_key_here
OPENAI_API_KEY=your_openai_api_key_here
GENIUS_ACCESS_SECRET=your_genius_access_secret_here
PIN_KEY=your_pinterest_api_key_here
REMOVE_BG_KEY=your_remove_bg_key_here
TRUECALLER_ID=your_truecaller_id_here
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
HEROKU_API_TOKEN=your_heroku_api_token_here
HEROKU_APP_NAME=your_heroku_app_name_here

# YouTube Download Configuration (Optional)
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

Install the dependencies:

    npm install

To run the bot, enter the following command:

    node index.js

## Accessing the Bot UI and QR Code

Once the bot is running, open your browser and navigate to:

    http://localhost:8000

(Note: The default port is 8000, but it can be configured using the `PORT` environment variable)

The UI will display a QR code that you need to scan with WhatsApp to authenticate the bot:

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code displayed in the browser

After successful authentication, the bot will be ready to use!

## Enabling Bot in Groups

For the bot to work in group chats, you need to enable it using one of these methods:

### Method 1: Using Owner Command
Send the following command from the owner's WhatsApp number in the group:

    group isBotOn:true

### Method 2: Direct MongoDB Configuration
Alternatively, you can directly update the group settings in your MongoDB database:

1. Access your MongoDB database
2. Navigate to the groups collection
3. Find the document for your group
4. Set the field `isBotOn` to `true`

**Note:** Only the owner number (specified in `MY_NUMBER` environment variable) can execute group configuration commands.

## evn

<img src="https://i.ibb.co/gMgnptR/env.jpg" alt="jacktheboss220" />

# References:

-   [@Baileys](https://github.com/WhiskeySockets/Baileys)

If you enjoyed using this project, please consider giving it a :star: on GitHub. Your support is greatly appreciated! :heart:
