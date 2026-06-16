import fs from "fs";
import util from "util";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const readdir = util.promisify(fs.readdir);

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mainPath = path.join(__dirname, "../commands/");

let commandsPublic = {};
let commandsMembers = {};
let commandsAdmins = {};
let commandsOwners = {};

const loadCommands = async (dirPath, commandsObj, cmdDetails) => {
	let filenames = await readdir(dirPath);
	for (const file of filenames) {
		if (file.endsWith(".js")) {
			try {
				// Use dynamic import for ESM
				// Convert Windows path to file:// URL for proper ESM import
				const filePath = path.join(dirPath, file);
				const fileUrl = pathToFileURL(filePath).href;
				const module = await import(fileUrl);

				// Commands export a function that returns the command object
				const commandFunc = module.default;
				if (!commandFunc || typeof commandFunc !== "function") {
					console.warn(`⚠️ Warning: ${file} does not export a function`);
					continue;
				}

				// Call the function to get the command info
				const cmd_info = commandFunc();

				// Validate command structure
				if (!cmd_info) {
					console.warn(`⚠️ Warning: ${file} function returned null/undefined`);
					continue;
				}
				if (!cmd_info.cmd || !Array.isArray(cmd_info.cmd)) {
					console.warn(`⚠️ Warning: ${file} has invalid cmd array:`, cmd_info.cmd);
					continue;
				}
				if (!cmd_info.handler || typeof cmd_info.handler !== "function") {
					console.warn(`⚠️ Warning: ${file} has invalid handler`);
					continue;
				}

				cmdDetails.push({ cmd: cmd_info.cmd, desc: cmd_info.desc, usage: cmd_info.usage });
				for (let c of cmd_info.cmd) {
					commandsObj[c] = cmd_info.handler;
				}
			} catch (error) {
				console.error(`❌ Error loading ${file}:`, error.message);
			}
		}
	}
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
	console.log("📦 Loading commands...");
	await loadCommands(mainPath + "public/", commandsPublic, []);
	console.log(`✅ Loaded ${Object.keys(commandsPublic).length} public commands`);
	await loadCommands(mainPath + "group/members/", commandsMembers, []);
	console.log(`✅ Loaded ${Object.keys(commandsMembers).length} member commands`);
	await loadCommands(mainPath + "group/admins/", commandsAdmins, []);
	console.log(`✅ Loaded ${Object.keys(commandsAdmins).length} admin commands`);
	await loadCommands(mainPath + "owner/", commandsOwners, []);
	console.log(`✅ Loaded ${Object.keys(commandsOwners).length} owner commands`);

	await deleteFiles("./", [".webp", ".jpeg", ".jpg", ".mp3", ".mp4", ".png", ".gif"]);
	console.log("🎉 All commands loaded successfully!");
};

let commandsLoaded = false;
const commandsReadyPromise = addCommands().then(() => { commandsLoaded = true; });

const cmdToText = async () => {
	let adminCommands = [];
	let publicCommands = [];
	let groupCommands = [];
	let ownerCommands = [];
	let directCommands = [];
	await loadCommands(mainPath + "public/", {}, directCommands);
	await loadCommands(mainPath + "public/", {}, publicCommands);
	await loadCommands(mainPath + "group/members/", {}, groupCommands);
	await loadCommands(mainPath + "group/admins/", {}, adminCommands);
	await loadCommands(mainPath + "owner/", {}, ownerCommands);
	return { publicCommands, groupCommands, adminCommands, ownerCommands, directCommands };
};

export { commandsPublic, commandsMembers, commandsAdmins, commandsOwners, cmdToText, commandsReadyPromise, commandsLoaded };
