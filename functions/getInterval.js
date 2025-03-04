let storeInterval;

const startInterval = async (store) => {
    storeInterval = setInterval(() => {
        store?.writeToFile("./baileys_store_multi.json");
    }, 1000 * 10);
};

const stopInterval = () => {
    clearInterval(storeInterval);
};

module.exports = { startInterval, stopInterval, storeInterval };
