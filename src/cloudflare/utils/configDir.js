const os = require("os");
const homedir = os.homedir();
const configDir = ".campion";

module.exports = `${homedir}/${configDir}`;

