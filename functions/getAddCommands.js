const fs = require("fs");
const util = require("util");
const readdir = util.promisify(fs.readdir);
const path = require("path");
const mainPath = path.join(__dirname, "../commands/");

let commandsPublic = {};
let commandsMembers = {};
let commandsAdmins = {};
let commandsOwners = {};

const addCommands = async () => {
    let path = mainPath + "public/";
    let filenames = await readdir(path);
    filenames.forEach((file) => {
        if (file.endsWith(".js")) {
            let { command } = require(path + file);
            let cmd_info = command();
            for (let c of cmd_info.cmd) {
                commandsPublic[c] = cmd_info.handler;
            }
        }
    });

    path = mainPath + "group/members/";
    filenames = await readdir(path);
    filenames.forEach((file) => {
        if (file.endsWith(".js")) {
            let { command } = require(path + file);
            let cmd_info = command();
            for (let c of cmd_info.cmd) {
                commandsMembers[c] = cmd_info.handler;
            }
        }
    });

    path = mainPath + "group/admins/";
    filenames = await readdir(path);
    filenames.forEach((file) => {
        if (file.endsWith(".js")) {
            let { command } = require(path + file);
            let cmd_info = command();
            for (let c of cmd_info.cmd) {
                commandsAdmins[c] = cmd_info.handler;
            }
        }
    });

    path = mainPath + "owner/";
    filenames = await readdir(path);
    filenames.forEach((file) => {
        if (file.endsWith(".js")) {
            let { command } = require(path + file);
            let cmd_info = command();
            for (let c of cmd_info.cmd) {
                commandsOwners[c] = cmd_info.handler;
            }
        }
    });

    //deleting the files .webp .jpeg .jpg .mp3 .mp4 .png
    path = "./";
    filenames = await readdir(path);
    filenames.forEach((file) => {
        if (
            file.endsWith(".webp") ||
            file.endsWith(".jpeg") ||
            file.endsWith(".mp3") ||
            file.endsWith(".mp4") ||
            file.endsWith(".jpg") ||
            file.endsWith(".png") ||
            file.endsWith(".gif")
        ) {
            fs.unlinkSync(path + file);
        }
    });
};

addCommands();

module.exports = { commandsPublic, commandsMembers, commandsAdmins, commandsOwners };