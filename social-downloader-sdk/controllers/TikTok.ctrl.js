const axios = require('axios');
const {genRestUrl} = require('../utils/api.utils');
const {controllers, methods} = require('../constants/api.constants');

class TikTokCtrl {
    constructor() {
    };

    getVideo = async (videoLink = '') => await axios.get(genRestUrl(controllers.tiktok, methods.video, {video_link: videoLink}));

    getAudio = async (videoLink = '') => await axios.get(genRestUrl(controllers.tiktok, methods.video, {video_link: videoLink}));
}

module.exports = TikTokCtrl;