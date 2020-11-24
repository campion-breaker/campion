const fetch = require("node-fetch");
const configDir = require("../../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

async function deleteAllKeys(namespace, keys) {
  const acctId = process.env.ACCOUNT_ID;
  const namespaceId = process.env[namespace];

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${acctId}/storage/kv/namespaces/${namespaceId}/bulk`,
    {
      method: "DELETE",
      body: JSON.stringify(keys),
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (!data.ok) {
    data.json().then(d => {
      console.log(d)
    });

  }
}

module.exports = deleteAllKeys;

