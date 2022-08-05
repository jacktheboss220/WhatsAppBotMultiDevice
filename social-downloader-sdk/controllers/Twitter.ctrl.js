const axios = require('axios');
const {genRestUrl} = require('../utils/api.utils');
const {controllers, methods} = require('../constants/api.constants');

class TwitterCtrl {
    constructor() {
    };

    getVideo = async (videoLink = '') => await axios.get(genRestUrl(controllers.twitter, methods.video, {video_link: videoLink}));
}

module.exports = TwitterCtrl;