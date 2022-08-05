const axios = require('axios');
const {genRestUrl} = require('../utils/api.utils');
const {controllers, methods} = require('../constants/api.constants');

class FacebookCtrl {
    constructor() {
    };

    getVideo = async (videoLink = '') => await axios.get(genRestUrl(controllers.facebook, methods.video, {video_link: videoLink}));
}

module.exports = FacebookCtrl;