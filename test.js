/**
 * @author: jacktheboss220
 */
require("dotenv").config();

//-------------------------------------------------------------------------------------------------------------//

// const fs = require('fs');
// const mdClient = require('./mongodb');

// const collection = mdClient.db("MyBotDataDB").collection("AuthTable");

// collection.deleteOne({ _id: "auth" }).then(res => {
//     console.log(res);
//     collection.find({}).toArray().then(res => {
//         console.log(res);
//     })
// });

// const collection = mdClient.db("MyBotDataDB").collection("Groups");

// const collection = mdClient.db("MyBotDataDB").collection("members");

// collection.find({ dmLimit: { $lt: 10000 } }).toArray().then(res => {
//         res.forEach(ele => {
//                 collection.updateOne({ _id: ele._id }, { $set: { dmLimit: 1000000 } }).then(res => {
//                         // console.log(res);
//                 })
//         });
// })

// collection.findOne({ _id: "918318585418@s.whatsapp.net" }).then(res => {
// console.log(res.test);
// console.log(res.warning.test);
// console.log(typeof (res.warning));
// })

// collection.aggregate([
//     { $match: { _id: "919557666582-1467533860@g.us" } },
//     { $unwind: "$members" },
//     { $sort: { "members.count": -1 } },
//     { $group: { _id: "$_id", memberCount: { $push: "$members" } } }
// ]).toArray().then(r => {
//     const t = r[0].memberCount.map(ele => {
//         return ele.name + " " + ele.count
//     })
//     console.log(t);
// });

//-------------------------------------------------------------------------------------------------------------//

// const { Configuration, OpenAIApi } = require("openai");
// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);
// (async () => {
//     const result = await openai.createImage({
//         prompt: "a man sitting at night watching the horizon, sky with stars, lake, 4k, ultra real",
//         n: 1,
//         size: "1024x1024",
//     });
//     console.log(result.data);
// })();

//-------------------------------------------------------------------------------------------------------------//

// const tts = require('google-tts-api');
// (async () => {
//     const url = tts.getAudioUrl('Hello World', {
//         lang: 'en',
//         slow: false,
//         host: 'https://translate.google.com',
//         timeout: 10000,
//     });
//     console.log(url);
// })();
//-------------------------------------------------------------------------------------------------------------//

// const gis = require('g-i-s');
// gis('cats', logResults);

// function logResults(error, results) {
//     if (error) {
//         console.log(error);
//     }
//     else {
//         console.log(JSON.stringify(results, null, '  '));
//     }
// }

//-------------------------------------------------------------------------------------------------------------//

// const { savefrom } = require('@bochilteam/scraper');
// (async () => {
//     const data = await savefrom('https://www.instagram.com/reel/Cu3zPb6Kf6c/?utm_source=ig_web_copy_link')
//     console.log(data) // JSON
// })();

//-------------------------------------------------------------------------------------------------------------//

// const axios = require('axios');

// const url = "https://worker.savefrom.net/savefrom.php";

// const url1 = "https://www.instagram.com/p/Cvlr-u4tfTe/?utm_source=ig_web_copy_link&igshid=MzRlODBiNWFlZA==";
// const payload = {
//     "sf_url": url1,
//     "sf_submit": "",
//     "new": 2,
//     "lang": "en",
//     "app": "",
//     "country": "in",
//     "os": "Windows",
//     "browser": "Chrome",
//     "channel": "main",
//     "sf-nomad": 1,
//     "url": url1,
//     "ts": 1691301740358,
//     "_ts": 1691163582244,
//     "_tsc": 0,
//     "_s": "ef3b2df49393398c5ccf16f8e5b784322922d81fe20bee58bf53d9a6aad393ab"
// }

// axios.post(url, payload, {
//     headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//     }
// }).then(response => {
//     console.log(response.data);
// }).catch(error => {
//     console.error(error);
// });

//-------------------------------------------------------------------------------------------------------------//

// const truecallerjs = require('truecallerjs');
// var searchData = {
//     number: "8318585418",
//     countryCode: "IN",
//     installationId: 'a1i0s--gyCXV4-G-x5QsSQeJZ5hhGTIBgZ6r6oXWgB-44NEw170V8yVxk6u1NahW',
// };

// truecallerjs.searchNumber(searchData).then((data) => {
//     console.log(JSON.stringify(data));
// }).catch((err) => {
//     console.log(err);
// });

//-------------------------------------------------------------------------------------------------------------//

// const url = "https://worker.savefrom.net/savefrom.php";

// const formData = {
//     "sf_url": "https://www.instagram.com/reel/CtGI1qguKUL/",
//     "sf_submit": "",
//     "new": 2,
//     "lang": "en",
//     "app": "",
//     "country": "in",
//     "os": "Windows",
//     "browser": "Chrome",
//     "channel": "main",
//     "sf-nomad": 1,
//     "url": "https://www.instagram.com/reel/CtGI1qguKUL/",
//     "ts": 1691294033867,
//     "_ts": 1691163582244,
//     "_tsc": 0,
//     "_s": "f4e70b3962c40c63ad64702bdeb02538b29cf8c7085641a38f8bb9f34ea311c7"
// }

// const axios = require('axios');

// axios.post(url, formData).then(res => {
//     console.log(res.data);
// }).catch(err => {
//     console.log(err);
// })

//-------------------------------------------------------------------------------------------------------------//

// const axios = require('axios');
// var __importDefault = (this && this.__importDefault) || function (mod) {
//     return (mod && mod.__esModule) ? mod : { "default": mod };
// };
// Object.defineProperty(exports, "__esModule", { value: true });
// const vm_1 = __importDefault(require("vm"));
// const url = "https://worker.savefrom.net/savefrom.php";

// const url1 = "https://www.instagram.com/p/CvgSKFLNjIh/?utm_source=ig_web_copy_link&igshid=MzRlODBiNWFlZA==";

// const payload = {
//     "sf_url": url1,
//     "sf_submit": "",
//     "new": 2,
//     "lang": "en",
//     "app": "",
//     "country": "in",
//     "os": "Windows",
//     "browser": "Chrome",
//     "channel": "main",
//     "sf-nomad": 1,
//     "url": url1,
//     // "ts": 1691304699154,
//     "_ts": 1691163582244,
//     "_tsc": 0,
//     "_s": "ef3b2df49393398c5ccf16f8e5b784322922d81fe20bee58bf53d9a6aad393ab"
// }

// axios.post(url, payload, {
//     headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//     }
// }).then(response => {
//     console.log(response.data);
//     let scriptJS = response.data;
//     const executeCode = '[]["filter"]["constructor"](b).call(a);';
//     if (scriptJS.indexOf(executeCode) === -1)
//         throw new Error(`Cannot find execute code\n${scriptJS}`);
//     scriptJS = scriptJS.replace(executeCode, `
// try {const script = ${executeCode.split('.call')[0]}.toString();if (script.includes('function showResult')) scriptResult = script;else (${executeCode.replace(/;/, '')});} catch {}
// `);
//     const context = {
//         scriptResult: '',
//         log: console.log
//     };
//     vm_1.default.createContext(context);
//     new vm_1.default.Script(scriptJS).runInContext(context);
//     const data = ((_a = context.scriptResult.split('window.parent.sf.videoResult.show(')) === null || _a === void 0 ? void 0 : _a[1]) || ((_b = context.scriptResult.split('window.parent.sf.videoResult.showRows(')) === null || _b === void 0 ? void 0 : _b[1]);
//     if (!data)
//         throw new Error(`Cannot find data ("${data}") from\n"${context.scriptResult}"`);
//     let json;
//     try {
//         // @ts-ignore
//         if (context.scriptResult.includes('showRows')) {
//             const splits = data.split('],"');
//             const lastIndex = splits.findIndex(v => v.includes('window.parent.sf.enableElement'));
//             json = JSON.parse(splits.slice(0, lastIndex).join('],"') + ']');
//         }
//         else {
//             json = [JSON.parse(data.split(');')[0])];
//         }
//     }
//     catch (e) {
//         json = null;
//     }

//     const result = json.map(item => item.url[0].url);
//     console.log(result);

// }).catch(error => {
//     console.error(error);
// });

// function parseTextCommand(text) {
//     const regex = /(?:([^;]+);)?(?:([^;]+);)?(?:([^;]+);)?(?:([^;]+);)?(?:([^;]+);)?/;

//     const matches = text.match(regex);

//     if (!matches) {
//         return null; // Invalid format
//     }

//     const [, fontColor, fontStrokeColor, fontSize, fontTop, fontBottom] = matches;

//     const parsedData = {
//         fontColor: fontColor || "defaultFontColor",
//         fontStrokeColor: fontStrokeColor || "defaultFontStrokeColor",
//         fontSize: fontSize || "defaultFontSize",
//         fontTop: fontTop || "defaultFontTop",
//         fontBottom: fontBottom || "defaultFontBottom",
//     };

//     return parsedData;
// }

//-------------------------------------------------------------------------------------------------------------//

// // const userInput = "#FF0000;;24;;Hello;World";
// const userInput = "24;Hello;World";
// const parsedResult = parseTextCommand(userInput);

// if (parsedResult) {
//     console.log(parsedResult);
// } else {
//     console.log("Invalid command format.");
// }

//-------------------------------------------------------------------------------------------------------------//

// const Genius = require("genius-lyrics");
// const { getLyrics } = require('genius-lyrics-api');
// const Client = new Genius.Client(process.env.GENIUS_ACCESS_SECRET);

// (async () => {
//     const searches = await Client.songs.search("shameless camila cabello");
//     const firstSong = searches[0];
//     let lyric = await firstSong.lyrics();
//     if (lyric == null) {
//         lyric = await getLyrics({ apiKey: process.env.GENIUS_ACCESS_SECRET, title: firstSong.title, artist: firstSong.artist.name, optimizeQuery: true });
//     }
//     console.log("Name: " + firstSong.title);
//     console.log("Artist: " + firstSong.artist.name);
//     console.log("Lyrics: " + lyric);
// })();

//-------------------------------------------------------------------------------------------------------------//

// const snapsave = require("snapsave-downloader");
// (async () => {
//     // let URL = await snapsave("https://www.instagram.com/p/CvmigYyovau/");
//     let URL = await snapsave("https://www.instagram.com/p/Cvq2RFMN-_z");
//     const data = [...new Set(URL.data.map(item => item.url))];
//     console.log(data);
// })();

//-------------------------------------------------------------------------------------------------------------//

// const fs = require("fs");
// const axios = require("axios");

// const baseURL = "https://www.googleapis.com/customsearch/v1";
// const googleapis = `?key=${process.env.GOOGLE_API_KEY}`;
// const searchEngineKey = `&cx=${process.env.SEARCH_ENGINE_KEY}`;
// const defQuery = "&q=";
// const evv = "realme 8"

// const urlToSearch = `${baseURL}${googleapis}${searchEngineKey}${defQuery}${evv}`;

// axios(urlToSearch).then(async (res) => {
//     const searchResults = res.data?.items;
//     const extractedData = searchResults.map(result => {
//         return {
//             title: result.title,
//             snippet: result.snippet,
//             link: result.link,
//         };
//     });

//     const message = extractedData.map(result => (
//         `Title: ${result.title}\nSnippet: ${result.snippet}\nLink: ${result.link}\n`
//     )).join('\n');

//     console.log(message);
// }).catch(() => {
// });

//-------------------------------------------------------------------------------------------------------------//

// require("dotenv").config();
// const truecallerjs = require('truecallerjs');

// (async () => {
//     var searchData = {
//         number: "918318585418",
//         countryCode: "IN",
//         installationId: process.env.TRUECALLER_ID
//     }

//     const response = await truecallerjs.search(searchData);
//     if (!response) return console.log("No data found");
//     const data = response.json().data[0];

//     const name = response.getName();
//     const { e164Format, numberType, countryCode, carrier, type } = data?.phones[0];
//     const { city } = response.getAddresses()[0];
//     const email = response.getEmailId();

//     const message = '*Name:* ' + name + '\n' +
//         '*Number:* ' + e164Format + '\n' +
//         '*City:* ' + city + '\n' +
//         '*Country Code:* ' + countryCode + '\n' +
//         '*Carrier:* ' + carrier + ', ' + numberType + '\n' +
//         // '*Type:* ' + type + '\n' +
//         '*Email:* ' + email + '\n';

//     console.log(message);

// })();

//-------------------------------------------------------------------------------------------------------------//

// const axios = require("axios");

// axios.get(`https://search5-noneu.truecaller.com/v2/search`, {
//     params: {
//         q: "9183185418",
//         countryCode: "IN",
//         type: 4,
//         locAddr: "",
//         placement: "SEARCHRESULTS,HISTORY,DETAILS",
//         encoding: "json",
//     },
//     headers: {
//         "content-type": "application/json; charset=UTF-8",
//         "accept-encoding": "gzip",
//         "user-agent": "Truecaller/13.28.6 (Android;13)",
//         Authorization: `Bearer ${process.env.TRUECALLER_ID}`,
//     },
// }).then((response) => {
//     console.log(response.data);
// }).catch((error) => {
//     console.log(error.response.data);
//     // console.log(error.response);
// });

//-------------------------------------------------------------------------------------------------------------//

// const axios = require("axios");
// (async () => {
//     await axios({
//         url: `https://www.instagram.com/__mahesh__01/?__a=1&__d=dis`,
//         headers: {
//             accept: "*/*",
//             "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
//             "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="102", "Google Chrome";v="102"',
//             "sec-ch-ua-mobile": "?0",
//             'sec-ch-ua-platform': '"Linux"',
//             "sec-fetch-dest": "empty",
//             "sec-fetch-mode": "cors",
//             "sec-fetch-site": "same-site",
//             'x-asbd-id': '198387',
//             'x-csrftoken': '9id7NIrYulj8aPVUSAOLvNC2nkhRRWdd',
//             'x-ig-app-id': '936619743392459',
//             'x-ig-www-claim': 'hmac.AR2rCmfN1Jb98fTtIV5rXy1EHz-DxQIGk6fgEQbmFdZp0uiw',
//             cookie: `sessionid=60827384736%3AU3JPMQmLdXWQjQ%3A15%3AAYdUsVYY5SDNLgt6nbAn1EN26nKQqxiV62_6E5djFA; ig_nrcb=1; fbm_124024574287414=base_domain=.instagram.com; ds_user_id=60827384736; dpr=1.5;`,
//             Referer: 'https://www.instagram.com/',
//             'Referrer-Policy': 'strict-origin-when-cross-origin',
//         },
//         method: "GET",
//     }).then(res => {
//         console.log(res.data.graphql.user.profile_pic_url_hd);
//     })

// })();

//-------------------------------------------------------------------------------------------------------------//

// const { getBotData } = require('./mongo-DB/botDataDb');

// (async () => {

//     const botData = await getBotData();

//     const text = botData.instaSession_id;

//     const sessionid = /sessionid=([^;]+);/.exec(text)[1];
//     const ds_user_id = /ds_user_id=([^;]+);/.exec(text)[1];

//     console.log(sessionid);
//     console.log(ds_user_id);
// })()

//-------------------------------------------------------------------------------------------------------------//

// const inshorts = require('inshorts-api');
// let arr = ['national', 'business', 'sports', 'world', 'politics', 'technology', 'startup', 'entertainment', 'miscellaneous', 'hatke', 'science', 'automobile'];

// var options = {
//     lang: 'en',
//     category: "",
//     numOfResults: 10
// }

// inshorts.get(options, function (result) {
//     let message = `☆☆☆☆💥 ${"" == "" ? "All" : newsType.toUpperCase()} 💥☆☆☆☆ \n\n${""}`;
//     for (const news of result) {
//         message += '🌐 ';
//         message += `${news.title} ~ ${news.author}\n`;
//         // message += `Author: ${news.author}\n`;
//         // message += `Content: ${news.content}\n`;
//         // message += `Posted At: ${news.postedAt}\n`;
//         // message += `Source URL: ${news.sourceURL}\n`;
//         message += '\n';
//     }
//     console.log(message);
// });

//-------------------------------------------------------------------------------------------------------------//

// const OpenAI = require('openai');

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY
// });

// async function main() {
//     const completion = await openai.chat.completions.create({
//         messages: [{ role: 'user', content: 'Say this is a testSay this is a testSay this is a testSay this is a testSay this is a testSay this is a testSay this is a testSay this is a testSay this is a testSay this is a testSay this is a testSay this is a testSay this is a testSay this is a testSay this is a test' }],
//         model: 'gpt-3.5-turbo',
//         max_tokens: 30,
//     });
//     // const completion = await openai.completions.create({
//     //     model: "text-davinci-003",
//     //     prompt: "This story begins",
//     //     max_tokens: 30,
//     // });

//     console.log(completion.choices);
// }

// main();

//-------------------------------------------------------------------------------------------------------------//
// const ytdl = require('ytdl-core');
// const youtubedl = require('youtube-dl-exec');

// // https://youtube.com/watch?v=Fp_P_e1cPOE
// (async () => {
//     let title = await ytdl.getInfo(URL).then(res => res.videoDetails.title.trim());
//     console.log(title);
// })();

// youtubedl("https://youtube.com/watch?v=Fp_P_e1cPOE", {
//     format: 'mp4',
//     output: "download.mp4",
//     maxFilesize: "104857600"
// }).then((r) => {
//     console.log(r);
//     if (r?.includes("max-filesize")) {
//         console.log("File size exceeds more then 100MB.");
//     } else {
//         console.log("File downloaded successfully.");
//     }
// }).catch(err => {
//     console.log(err);
// })

// const snapsave = require("insta-downloader");

// const handler = async (urlInsta) => {

//     snapsave(urlInsta).then(async res => {
//         console.log(res);
//     }).catch(err => {
//         console.log(err);
//     });
// }

// handler("https://www.instagram.com/reel/Cx8YUHyoN0_/?utm_source=ig_web_copy_link");

// const youtubedl = require('youtube-dl-exec');
// const audioFormat = 'mp3'; // Choose your desired audio format (e.g., mp3, flac)
// const outputFilename = 'audio.mp3'; // Output filename

// async function downloadAudio(url) {
//     try {

//         const result = await youtubedl(url, {
//             format: 'm4a',
//             output: outputFilename,
//             maxFilesize: "104857600",
//             preferFreeFormats: true,
//         });

//         console.log(`Downloaded audio: ${result}`);
//     } catch (error) {
//         console.error(`Error downloading audio: ${error.message}`);
//     }
// }

// // Replace with your actual YouTube link

// downloadAudio(youtubeLink);

// const URL = 'https://www.youtube.com/watch?v=PGPVZT3Blvs';
// const URL = 'https://www.youtube.com/watch?v=c3L0fbtftRY';
// const URL = 'https://youtu.be/fx2Z5ZD_Rbo?si=X2O0MmuOukEjKVw8';
// const fileDown = 'download.mp4';
// const fs = require('fs');

// (async () => {

// const stream = youtubedl(URL, {
//     format: 'mp4',
//     output: "down.mp4",
//     // maxFilesize: "104857600"
// });

// await Promise.all([stream]).then(async (r) => {
//     console.log(r);
//     if (r?.includes("max-filesize")) {
//         console.log("File size exceeds more then 100MB.");
//     } else {
//         console.log("File downloaded successfully.");
//     }
// }).catch(err => {
//     console.log(err);
// });

//     try {
//         ytdl(URL, {
//             // filter: format => format.container === 'mp4',
//             // filter: format => format.container === 'm4a',
//             // format: 'm4a',
//             filter: info => info.hasVideo && info.hasAudio,
//             // filter: info => info.itag
//         }).pipe(fs.createWriteStream("fileDown.mp4")).on('finish', () => {
//             console.log("Video downloaded")
//         }).on('error', (err) => {
//             console.log(err);
//         });
//     } catch (err) {
//         console.log(err);
//     }

// })();

// .then((res) => {
// fs.writeFileSync("./groupParticipants.json", JSON.stringify(res, null, 2));
// });
// const allGroupData = JSON.parse(fs.readFileSync('groupParticipants.json'));

// console.log(Object.keys(allGroupData).map(r => {
//     return {
//         name: allGroupData[r].subject,
//         jid: r,
//         count: allGroupData[r].participants.length
//     }
// }).filter(r => r.name.includes("<{PVX}>")));
// fs.writeFileSync('common1.json', JSON.stringify(commonInBoth.map(r => parseInt(r.split("@")[0])), null, 2));

// const fs = require('fs');

// (async () => {

//     let groupParticipationData = await sock.groupFetchAllParticipating();

//     const group1 = groupParticipationData["919557666582-1628610549@g.us"].participants.filter(r => r.admin == null).map(r => r.id);
//     const group2 = groupParticipationData["919557666582-1586018947@g.us"].participants.filter(r => r.admin == null).map(r => r.id);

//     const commonMembers = await group1.filter(r => group2.includes(r));

//     for await (const member of commonMembers) {
//         await new Promise((resolve) => setTimeout(resolve, 1000 * 30));
//         await sock.groupParticipantsUpdate("919557666582-1628610549@g.us", [member + "@s.whatsapp.net"], "remove").then((res) => {
//             sock.sendMessage(from, {
//                 text: "Removed " + member
//             });
//         }).catch((err) => {
//             sock.sendMessage(from, {
//                 text: "Error: " + err
//             });
//         });
//     }
// })();

// const str = process.env.test || "";

// if (!str) {
//     console.log("No data found");
// }

// const handler = async (sock, msg, from, args, msgInfoObj) => {
//     const codeReceived = args.join(" ");
//     const { sendMessageWTyping } = msgInfoObj;
//     try {
//         // Use a custom function to capture the output of console.log
//         let consoleOutput = '';
//         const captureConsoleLog = message => {
//             consoleOutput += message + '\n';
//         };
//         const consoleLogProxy = new Proxy(console.log, {
//             apply: (target, thisArg, argumentsList) => {
//                 captureConsoleLog(argumentsList.join(' '));
//                 Reflect.apply(target, thisArg, argumentsList);
//             }
//         });
//         const sandbox = { console: { log: consoleLogProxy } };

//         // Evaluate the code in a sandboxed environment
//         const result = await evalInContext(codeReceived, sandbox);

//         // Check if the result is a string or an object
//         const resultText = typeof result === 'string' ? result : JSON.stringify(result);

//         // Send the captured console output and the result as a text message
//         sendMessageWTyping(from, { text: `Console Output:\n${consoleOutput}\nResult: ${resultText}` }, { quoted: msg });
//     }
//     catch (err) {
//         console.log(err);
//         sendMessageWTyping(from, { text: `❌ Error: ${err.toString()}` }, { quoted: msg });
//     }
// }

// // Function to evaluate code in a sandboxed environment
// const evalInContext = async (code, context) => {
//     const vm = require('vm');
//     const sandbox = { ...context };
//     const script = new vm.Script(code);
//     const result = script.runInNewContext(sandbox);
//     return result;
// }

// module.exports.command = () => ({ cmd: ['exec', 'execute'], handler });

//
// const ytdl = require('ytdl-core');
// const fs = require('fs');
// const { log } = require("console");
// const path = require('path');

// const outputName = 'video.mp4';
// const outputPath = path.resolve(__dirname, outputName);

// const jsonCookie = fs.readFileSync('./www.youtube.com_cookies.json', 'utf8');
// const COOKIE = JSON.parse(jsonCookie).map(r => `${r.name}=${r.value}`).join("; ");

// return log(COOKIE);
// const videoID = 'https://www.youtube.com/watch?v=lwVhz0QCFEY&bpctr=9999999999&has_verified=1';
// const videoID = 'aqz-KE-bpKQ';

// const videoID = 'lwVhz0QCFEY';
// const x_youtube_identity_token = `QUFFLUhqbHhVazkzOE5mVjlpWDdnLTF4R0Y1bk4wQTdZQXw\\u003d`;
// const filepath = path.resolve(__dirname, 'info.json');

// async function start() {
//     try {

//         ytdl.getInfo(videoID, {
//             requestOptions: {
//                 COOKIE,
//                 x_youtube_identity_token
//             }
//         }).then(info => {
//             console.log('title:', info.videoDetails.title);
//             console.log('rating:', info.player_response.videoDetails.averageRating);
//             console.log('uploaded by:', info.videoDetails.author.name);
//             const json = JSON.stringify(info, null, 2)
//                 // eslint-disable-next-line max-len
//                 .replace(/(ip(?:=|%3D|\/))((?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|[0-9a-f]{1,4}(?:(?::|%3A)[0-9a-f]{1,4}){7})/ig, '$10.0.0.0');
//             fs.writeFile(filepath, json, err2 => {
//                 if (err2) throw err2;
//             });
//         });

// const video = await ytdl.getInfo(videoID, {
//     requestOptions: {
//         headers: {
//             cookie: COOKIE,
//             "x-youtube-identity-token": x_youtube_identity_token
//         },
//     },
// });

// const output = `${video.videoDetails.title}`;
// console.log('Saving to', output);

// video.on('info', info => {
//     console.log('title:', info.videoDetails.title);
//     console.log('rating:', info.player_response.videoDetails.averageRating);
//     console.log('uploaded by:', info.videoDetails.author.name);
// });

// video.on('progress', (chunkLength, downloaded, total) => {
//     const percent = downloaded / total;
//     console.log('downloading', `${(percent * 100).toFixed(1)}%`);
// });

// video.on('end', () => {
//     console.log('saved to', outputName);
// });

// video.pipe(fs.createWriteStream(outputPath));

// video.on('error', (err) => {
//     console.log(err);
//     process.exit(1);
// });

//     } catch (e) {
//         console.error(e)
//     }
// }

// start();

// Build-in with nodejs

// const cp = require('child_process');
// const readline = require('readline');

// // External modules
// const ffmpeg = require('ffmpeg-static');

// // Global constants
// const ytdl = require("@distube/ytdl-core");
// const { getRandomIPv6 } = require("@distube/ytdl-core/lib/utils");

// const fs = require("fs");

// const agentOptions = {
//         pipelining: 5,
//         maxRedirections: 0,
//         localAddress: "127.0.0.1",
// };

// const agent = ytdl.createAgent(undefined, {
//         localAddress: getRandomIPv6("2001:2::/48"),
// });

// const agent = ytdl.createAgent(JSON.parse(fs.readFileSync("www.youtube.com_cookies.json")), agentOptions);

// ytdl.getInfo("http://www.youtube.com/watch?v=aqz-KE-bpKQ").then(info => {
//         fs.writeFileSync("info.json", JSON.stringify(info, null, 2));
// }, { agent });

// ytdl("http://www.youtube.com/watch?v=aqz-KE-bpKQ", {
//         format: "highest",
//         agent: agent,
// }).pipe(require("fs").createWriteStream("video.mp4"));

/**
 * Reen code audio & video without creating files first
 *
 * Requirements: ffmpeg, ether via a manual installation or via ffmpeg-static
 *
 * If you need more complex features like an output-stream you can check the older, more complex example:
 * https://github.com/fent/node-ytdl-core/blob/cc6720f9387088d6253acc71c8a49000544d4d2a/example/ffmpeg.js
 */

// "ultimate-text-to-image": "^1.0.1",

// const URL = 'https://youtube.com/watch?v=qzDz7a-dGJY';

// (async () => {
//         let title = await ytdl.getBasicInfo(URL).then(info => info.videoDetails.title, { agent }) + 'out.mkv';
//         console.log(title);

//         const tracker = {
//                 start: Date.now(),
//                 audio: { downloaded: 0, total: Infinity },
//                 video: { downloaded: 0, total: Infinity },
//                 merged: { frame: 0, speed: '0x', fps: 0 },
//         };

//         // Get audio and video streams
//         const audio = ytdl(URL, {
//                 agent,
//                 quality: 'highestaudio',
//         }).on('progress', (_, downloaded, total) => {
//                 tracker.audio = { downloaded, total };
//         });

//         audio.on('end', () => {
//                 console.log('audio end');
//         });

//         audio.on('error', (err) => {
//                 console.log(err);
//         });

//         const video = ytdl(URL, {
//                 agent,
//                 quality: 'highestvideo',
//         }).on('progress', (_, downloaded, total) => {
//                 tracker.video = { downloaded, total };
//         });

//         video.on('end', () => {
//                 console.log('video end');
//         });

//         video.on('error', (err) => {
//                 console.log(err);
//         });

//         // Prepare the progress bar
//         let progressBarHandle = null;
//         const progressBarInterval = 1000;

//         const showProgress = () => {
//                 readline.cursorTo(process.stdout, 0);
//                 const toMB = i => (i / 1024 / 1024).toFixed(2);

//                 process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
//                 process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

//                 process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
//                 process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

//                 process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
//                 process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

//                 process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
//                 readline.moveCursor(process.stdout, 0, -3);
//         };

//         // Start the ffmpeg child process
//         const ffmpegProcess = cp.spawn(ffmpeg, [
//                 // Remove ffmpeg's console spamming
//                 '-loglevel', '8', '-hide_banner',
//                 // Redirect/Enable progress messages
//                 '-progress', 'pipe:3',
//                 // Set inputs
//                 '-i', 'pipe:4',
//                 '-i', 'pipe:5',
//                 // Map audio & video from streams
//                 '-map', '0:a',
//                 '-map', '1:v',
//                 // Keep encoding
//                 '-c:v', 'copy',
//                 // Define output file
//                 title
//         ], {
//                 windowsHide: true,
//                 stdio: [
//                         /* Standard: stdin, stdout, stderr */
//                         'inherit', 'inherit', 'inherit',
//                         /* Custom: pipe:3, pipe:4, pipe:5 */
//                         'pipe', 'pipe', 'pipe',
//                 ],
//         });

//         ffmpegProcess.on('close', () => {
//                 console.log('done');
//                 // Cleanup
//                 process.stdout.write('\n\n\n\n');
//                 clearInterval(progressBarHandle);
//         });

//         // Link streams
//         // FFmpeg creates the transformer streams and we just have to insert / read data

//         ffmpegProcess.stdio[3].on('data', chunk => {
//                 // Start the progress bar
//                 if (!progressBarHandle) progressBarHandle = setInterval(showProgress, progressBarInterval);
//                 // Parse the param=value list returned by ffmpeg
//                 const lines = chunk.toString().trim().split('\n');
//                 const args = {};
//                 for (const l of lines) {
//                         const [key, value] = l.split('=');
//                         args[key.trim()] = value.trim();
//                 }
//                 tracker.merged = args;
//         });

//         audio.pipe(ffmpegProcess.stdio[4]);
//         video.pipe(ffmpegProcess.stdio[5]);
// })();

// require("dotenv").config();
// const { TwitterApi } = require("twitter-api-v2");
// const axios = require("axios");
// const fs = require("fs");
// const path = require("path");

// const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

// async function downloadMedia(url, filename) {
// 	const response = await axios({
// 		url,
// 		method: "GET",
// 		responseType: "stream",
// 	});

// 	const writer = fs.createWriteStream(path.resolve(__dirname, filename));
// 	response.data.pipe(writer);

// 	return new Promise((resolve, reject) => {
// 		writer.on("finish", resolve);
// 		writer.on("error", reject);
// 	});
// }

// async function fetchTweetData(tweetUrl) {
// 	try {
// 		const tweetId = tweetUrl.split("/").pop().split("?")[0];
// 		const tweet = await client.v2.singleTweet(tweetId, {
// 			expansions: ["attachments.media_keys", "author_id"],
// 			"media.fields": ["url", "type"],
// 			"tweet.fields": ["text"],
// 		});

// 		const tweetText = tweet.data.text;
// 		console.log("Tweet Text:", tweetText);

// 		if (tweet.includes && tweet.includes.media) {
// 			for (const media of tweet.includes.media) {
// 				if (media.type === "photo") {
// 					await downloadMedia(media.url, `image_${media.media_key}.jpg`);
// 					console.log(`Downloaded image: image_${media.media_key}.jpg`);
// 				} else if (media.type === "video") {
// 					const videoUrl = media.variants
// 						.filter((variant) => variant.content_type === "video/mp4")
// 						.reduce((prev, current) => (prev.bit_rate > current.bit_rate ? prev : current)).url;
// 					await downloadMedia(videoUrl, `video_${media.media_key}.mp4`);
// 					console.log(`Downloaded video: video_${media.media_key}.mp4`);
// 				}
// 			}
// 		} else {
// 			console.log("No media found in this tweet.");
// 		}
// 	} catch (error) {
// 		console.error("Error fetching tweet data:", error);
// 	}
// }

// // Example usage:
// fetchTweetData("https://x.com/craigbrockie/status/1909599329993851070");
