import sendToTelegram from "./telegramLogger.js";

const notifyOwner = (sock, mess, msg) => {
	sendToTelegram(mess);
};

export default notifyOwner;
