const VKontakteCtrl = require('./controllers/VKontakte.ctrl');
const InstagramCtrl = require('./controllers/Instagram.ctrl');
const FacebookCtrl = require('./controllers/Facebook.ctrl');
const SnapchatCtrl = require('./controllers/Snapchat.ctrl');
const TwitterCtrl = require('./controllers/Twitter.ctrl');
const YouTubeCtrl = require('./controllers/YouTube.ctrl');
const TikTokCtrl = require('./controllers/TikTok.ctrl');

const VKontakte = new VKontakteCtrl();
const Instagram = new InstagramCtrl();
const Facebook = new FacebookCtrl();
const Snapchat = new SnapchatCtrl();
const Twitter = new TwitterCtrl();
const YouTube = new YouTubeCtrl();
const TikTok = new TikTokCtrl();

module.exports = {
    VKontakte,
    Instagram,
    Facebook,
    Snapchat,
    Twitter,
    YouTube,
    TikTok
};