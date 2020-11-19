const configDir = require("./configDir");
const fs = require("fs");
require("dotenv").config({ path: `${configDir}/.env` });

const writeIdToEnv = (name, id) => {
  process.env[name] = id;
  fs.appendFileSync(`${configDir}/.env`, `\n${name}=${id}`);
  fs.appendFileSync(`${__dirname}/../../front_end/app/.env`, `\nREACT_APP_${name}=${id}`);
};

module.exports = writeIdToEnv;
