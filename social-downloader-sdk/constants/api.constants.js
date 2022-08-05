const endpoint = `https://social-downloader-i01.herokuapp.com`;

const controllers = {
    vkontakte: 'vkontakte',
    instagram: 'instagram',
    facebook: 'facebook',
    snapchat: 'snapchat',
    twitter: 'twitter',
    youtube: 'youtube',
    tiktok: 'tik-tok'
};

const methods = {
    highlights: 'highlights',
    stories: 'stories',
    video: 'video',
    audio: 'audio',
    any: 'any'
};

module.exports = {
    controllers,
    endpoint,
    methods
};