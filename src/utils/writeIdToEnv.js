const configDir = require("./configDir");
const fs = require("fs");
require("dotenv").config({ path: `${configDir}/.env` });

const writeIdToEnv = (name, id) => {
  process.env[name] = id;
  fs.appendFileSync(`${configDir}/.env`, `\n${name}=${id}`);
};

module.exports = writeIdToEnv;
