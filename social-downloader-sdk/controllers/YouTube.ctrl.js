const axios = require('axios');
const {genRestUrl} = require('../utils/api.utils');
const {controllers, methods} = require('../constants/api.constants');

class YouTubeCtrl {
    constructor() {
    };

    getVideo = async (videoLink = '') => await axios.get(genRestUrl(controllers.youtube, methods.video, {video_link: videoLink}));

    getAudio = async (videoLink = '') => await axios.get(genRestUrl(controllers.youtube, methods.video, {video_link: videoLink}));
}

module.exports = YouTubeCtrl;