const fs = require("fs");
const util = require("util");
const readdir = util.promisify(fs.readdir);
const path = require("path");
const mainPath = path.join(__dirname, "../commands/");

let commandsPublic = {};
let commandsMembers = {};
let commandsAdmins = {};
let commandsOwners = {};

const loadCommands = async (dirPath, commandsObj, cmdDetails) => {
	let filenames = await readdir(dirPath);
	filenames.forEach((file) => {
		if (file.endsWith(".js")) {
			let { command } = require(dirPath + file);
			let cmd_info = command();
			cmdDetails.push({ cmd: cmd_info.cmd, desc: cmd_info.desc, usage: cmd_info.usage });
			for (let c of cmd_info.cmd) {
				commandsObj[c] = cmd_info.handler;
			}
		}
	});
};

const deleteFiles = async (dirPath, extensions) => {
	let filenames = await readdir(dirPath);
	filenames.forEach((file) => {
		if (extensions.some((ext) => file.endsWith(ext))) {
			fs.unlinkSync(dirPath + file);
		}
	});
};

const addCommands = async () => {
	await loadCommands(mainPath + "public/", commandsPublic, []);
	await loadCommands(mainPath + "group/members/", commandsMembers, []);
	await loadCommands(mainPath + "group/admins/", commandsAdmins, []);
	await loadCommands(mainPath + "owner/", commandsOwners, []);

	await deleteFiles("./", [".webp", ".jpeg", ".jpg", ".mp3", ".mp4", ".png", ".gif"]);
};

addCommands();

const cmdToText = () => {
	let adminCommands = [];
	let publicCommands = [];
	let ownerCommands = [];
	let directCommands = [];

	return new Promise(async (resolve, reject) => {
		await loadCommands(mainPath + "public/", {}, directCommands);
		await loadCommands(mainPath + "public/", {}, publicCommands);
		await loadCommands(mainPath + "group/members/", {}, publicCommands);
		await loadCommands(mainPath + "group/admins/", {}, adminCommands);
		await loadCommands(mainPath + "owner/", {}, ownerCommands);
		resolve({ publicCommands, adminCommands, ownerCommands, directCommands });
	});
};

module.exports = { commandsPublic, commandsMembers, commandsAdmins, commandsOwners, cmdToText };
