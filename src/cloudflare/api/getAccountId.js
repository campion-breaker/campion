const fetch = require("node-fetch");
const configDir = require("../utils/configDir");
const writeIdToEnv = require("../utils/writeIdToEnv");
require("dotenv").config({ path: `${configDir}/.env` });

async function getAccountId() {
  const data = await fetch("https://api.cloudflare.com/client/v4/accounts", {
    headers: {
      "X-Auth-Email": process.env.EMAIL,
      "X-Auth-Key": process.env.APIKEY,
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) throw new Error("\nInvalid Credentials.");
  const body = await data.json();
  const acctId = body.result[0].id;
  writeIdToEnv('ACCOUNT_ID', acctId);
}

module.exports = getAccountId;
