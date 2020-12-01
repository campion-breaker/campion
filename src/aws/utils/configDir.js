const os = require("os");
const homedir = os.homedir();
const configDir = ".campionaws";

module.exports = `${homedir}/${configDir}`;
