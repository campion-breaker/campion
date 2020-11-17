const fetch = require("node-fetch");
const configDir = require("../../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

async function getServiceConfig() {
  const acctId = process.env.ACCOUNT_ID;
  const configNamespaceId = process.env.SERVICES_CONFIG_ID;

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${acctId}/storage/kv/namespaces/${configNamespaceId}/keys`,
    {
      method: "GET",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (data.ok) {
    const body = await data.json();
    return body.result;
  } else {
    throw new Error(`\nUnable to list services.`);
  }
}

module.exports = getServiceConfig;
