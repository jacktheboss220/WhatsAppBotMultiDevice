const axios = require('axios');
const {genRestUrl} = require('../utils/api.utils');
const {controllers, methods} = require('../constants/api.constants');

class InstagramCtrl {
    constructor() {
    };

    getHighlights = async (username = '') => await axios.get(genRestUrl(controllers.instagram, methods.highlights, {username}));

    getStories = async (username = '') => await axios.get(genRestUrl(controllers.instagram, methods.stories, {username}));

    getAny = async (link = '') => await axios.get(genRestUrl(controllers.instagram, methods.any, {link}));
}

module.exports = InstagramCtrl;