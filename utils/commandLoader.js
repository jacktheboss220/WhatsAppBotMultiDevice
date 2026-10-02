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

// Populated once by addCommands() and reused by cmdToText() — avoids re-scanning
// and re-importing every command file on every -help/-owner/-admin call.
const publicDetails = [];
const groupDetails = [];
const adminDetails = [];
const ownerDetails = [];

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

const addCommands = async () => {
	console.log("📦 Loading commands...");
	await loadCommands(mainPath + "public/", commandsPublic, publicDetails);
	console.log(`✅ Loaded ${Object.keys(commandsPublic).length} public commands`);
	await loadCommands(mainPath + "group/members/", commandsMembers, groupDetails);
	console.log(`✅ Loaded ${Object.keys(commandsMembers).length} member commands`);
	await loadCommands(mainPath + "group/admins/", commandsAdmins, adminDetails);
	console.log(`✅ Loaded ${Object.keys(commandsAdmins).length} admin commands`);
	await loadCommands(mainPath + "owner/", commandsOwners, ownerDetails);
	console.log(`✅ Loaded ${Object.keys(commandsOwners).length} owner commands`);

	console.log("🎉 All commands loaded successfully!");
};

let commandsLoaded = false;
const commandsReadyPromise = addCommands().then(() => { commandsLoaded = true; });

// Reuses the details collected once by addCommands() instead of re-scanning and
// re-importing every command file on every call (was happening on every -help/-owner/-admin).
const cmdToText = async () => {
	if (!commandsLoaded) await commandsReadyPromise;
	return {
		publicCommands: publicDetails,
		groupCommands: groupDetails,
		adminCommands: adminDetails,
		ownerCommands: ownerDetails,
		directCommands: publicDetails,
	};
};

export { commandsPublic, commandsMembers, commandsAdmins, commandsOwners, cmdToText, commandsReadyPromise, commandsLoaded };
