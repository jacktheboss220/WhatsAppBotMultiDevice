const querystring = require('querystring');
const {endpoint} = require('../constants/api.constants');

const genRestUrl = (controller, method, query = {}) => `${endpoint}/api/${controller}/${method}?${querystring.stringify(query)}`;

module.exports = {
    genRestUrl
};