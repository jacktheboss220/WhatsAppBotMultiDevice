/**
 * Classifies a message by its content type — is it media itself, or a reply
 * quoting/tagging a message that contains media. Duplicated verbatim across
 * ~7 command files before being pulled out here.
 */
export const getMediaFlags = (type, content) => ({
	isMedia: type === "imageMessage" || type === "videoMessage",
	isTaggedImage: type === "extendedTextMessage" && content.includes("imageMessage"),
	isTaggedVideo: type === "extendedTextMessage" && content.includes("videoMessage"),
	isTaggedSticker: type === "extendedTextMessage" && content.includes("stickerMessage"),
});
