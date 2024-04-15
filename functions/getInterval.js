const { updateLogin } = require("./getAuthDB");

let updateInterval, storeInterval;

const startInterval = async (store) => {
    updateInterval = setInterval(() => {
        updateLogin();
    }, 1000 * 60 * 15); // 15 minutes
    storeInterval = setInterval(() => {
        store?.writeToFile("./baileys_store_multi.json");
    }, 1000 * 10);
};

const stopInterval = () => {
    clearInterval(updateInterval);
    clearInterval(storeInterval);
};

module.exports = { startInterval, stopInterval, updateInterval, storeInterval };
