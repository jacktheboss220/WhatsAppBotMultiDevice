[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate/?hosted_button_id=ZY7DX3DKCVCWE)

# Social Downloader SDK

Download Video/Audio/Story/Photo/Reels/IGTV with info from TikTok, Instagram, Facebook, Youtube,Twitter, SnapChat, VKontakte.
Without watermark.
Short link support.
Build your own downloader.

## Get Started

```javascript
const {
    VKontakte,
    Instagram,
    Facebook,
    Snapchat,
    Twitter,
    YouTube,
    TikTok
} = require('./social-downloader-sdk');

const resVideo = await TikTok.getVideo('https://www.tiktok.com/@lucas_automobile/video/6923946880527289605');
console.log(resVideo.data);
const resAudio = await TikTok.getAudio('https://www.tiktok.com/@lucas_automobile/video/6923946880527289605');
console.log(resA.resAudio);
```

## Running Test

To run tests, run the following command
```bash
node test.js
```

## Models

#### Response Model
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `hasError` | `boolean` | ***true** if has error* |
| `errorCode` | `integer` | *error code. **0** if success* |
| `errorMessage` | `string` | *error message. **null** if has error*
| `errorDescription` | `string` | *error description. **null** if has error* |
| `body` | `object` | ***null** if has error* |

## API Reference

#### Get TikTok video and info
```javascript
const resVideo = await TikTok.getVideo('https://www.tiktok.com/@lucas_automobile/video/6923946880527289605');
console.log(resVideo.data);
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `videoLink` | `string` | **Required** |

#### Get TikTok audio and info
```javascript
const resAudio = await TikTok.getAudio('https://www.tiktok.com/@lucas_automobile/video/6923946880527289605');
console.log(resAudio.data);
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `videoLink` | `string` | **Required** |

#### Get YouTube video and info
```javascript
const resVideo = await YouTube.getVideo('https://www.youtube.com/watch?v=K9W0MtwrK98');
console.log(resVideo.data);
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `videoLink` | `string` | **Required** |

#### Get YouTube audio and info
```javascript
const resAudio = await YouTube.getAudio('https://www.youtube.com/watch?v=K9W0MtwrK98');
console.log(resAudio.data);
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `videoLink` | `string` | **Required** |

#### Get Facebook video and info
```javascript
const res = await Facebook.getVideo('https://www.facebook.com/watch?v=461079905306774');
console.log(res.data);
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `videoLink` | `string` | **Required** |

#### Get Instagram stories and info
```javascript
const res = await Instagram.getStories('jlo');
console.log(res.data);
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Required** |

#### Get Instagram highlights and info
```javascript
const res = await Instagram.getHighlights('jlo');
console.log(res.data);
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Required** |

#### Get any from Instagram
```javascript
const res = await Instagram.getAny('https://www.instagram.com/tv/CXfWkHfDcIA/');
console.log(res.data);
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `link` | `string` | **Required** |

#### Get any from Snapchat
```javascript
const res = await Snapchat.getAny('username here');
console.log(res.data);
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Required** |

#### Get VKontakte video and info
```javascript
const res = await VKontakte.getVideo('https://vk.com/video-34938135_456239023');
console.log(res.data);
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `videoLink` | `string` | **Required** |

## Example and Test script

```javascript
const {
    VKontakte,
    Instagram,
    Facebook,
    Snapchat,
    Twitter,
    YouTube,
    TikTok
} = require('./social-downloader-sdk');

(async () => {
    await (async () => {
        console.log('--------------- VKontakte Start ---------------')
        console.log('*************** Video Start ***************')
        const res = await VKontakte.getVideo('https://vk.com/video-34938135_456239023');
        console.log(res.data);
        console.log('*************** Video End ***************')
        console.log('--------------- VKontakte End ---------------')
    })();

    await (async () => {
        console.log('--------------- Instagram Start ---------------')
        console.log('*************** Story Start ***************')
        const res = await Instagram.getStories('jlo');
        console.log(res.data);
        console.log('*************** Story End ***************')
        console.log('--------------- Instagram End ---------------')
    })();

    await (async () => {
        console.log('--------------- Facebook Start ---------------')
        console.log('*************** Video Start ***************')
        const res = await Facebook.getVideo('https://www.facebook.com/watch?v=461079905306774');
        console.log(res.data);
        console.log('*************** Video End ***************')
        console.log('--------------- Facebook End ---------------')
    })();

    await (async () => {
        console.log('--------------- Snapchat Start ---------------')
        console.log('*************** Any Start ***************')
        const res = await Snapchat.getAny('hatanbado');
        console.log(res.data);
        console.log('*************** Any End ***************')
        console.log('--------------- Snapchat End ---------------')
    })();

    await (async () => {
        console.log('--------------- Twitter Start ---------------')
        console.log('*************** Video Start ***************')
        const res = await Twitter.getVideo('https://twitter.com/BMW/status/1488512770006003716?s=20&t=Fifbi7XLqg6ElBcCyWXK_A');
        console.log(res.data);
        console.log('*************** Video End ***************')
        console.log('--------------- Twitter End ---------------')
    })();

    await (async () => {
        console.log('--------------- YouTube Start ---------------')
        console.log('*************** Video Start ***************')
        const resV = await YouTube.getVideo('https://www.youtube.com/watch?v=K9W0MtwrK98');
        console.log(resV.data);
        console.log('*************** Video End ***************')
        console.log('*************** Audio Start ***************')
        const resA = await YouTube.getAudio('https://www.youtube.com/watch?v=K9W0MtwrK98');
        console.log(resA.data);
        console.log('*************** Audio End ***************')
        console.log('--------------- YouTube End ---------------')
    })();

    await (async () => {
        console.log('--------------- TikTok Start ---------------')
        console.log('*************** Video Start ***************')
        const resV = await TikTok.getVideo('https://www.tiktok.com/@lucas_automobile/video/6923946880527289605');
        console.log(resV.data);
        console.log('*************** Video End ***************')
        console.log('*************** Audio Start ***************')
        const resA = await TikTok.getAudio('https://www.tiktok.com/@lucas_automobile/video/6923946880527289605');
        console.log(resA.data);
        console.log('*************** Audio End ***************')
        console.log('--------------- TikTok End ---------------')
    })();
})();
```

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate/?hosted_button_id=ZY7DX3DKCVCWE)