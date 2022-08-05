const axios = require('axios');
const {genRestUrl} = require('../utils/api.utils');
const {controllers, methods} = require('../constants/api.constants');

class SnapchatCtrl {
    constructor() {
    };

    getAny = async (username = '') => await axios.get(genRestUrl(controllers.snapchat, methods.any, {username}));
}

module.exports = SnapchatCtrl;