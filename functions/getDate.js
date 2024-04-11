const getDate = () => {
    const dateIn = new Date().toLocaleString("en-US", {
        timeZone: "Asia/kolkata",
    });
    const date = new Date(dateIn);
    return date;
};

module.exports = getDate;

