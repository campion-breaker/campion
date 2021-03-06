const fetch = require("node-fetch");
const configDir = require("../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

async function deleteServiceConfig(id) {
  const accountId = process.env.ACCOUNT_ID;
  const configId = process.env.SERVICES_CONFIG_ID;
  id = id.replace(/\//g, "%2F");

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${configId}/values/${id}/`,
    {
      method: "DELETE",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "text/plain",
      },
    }
  );

  if (!data.ok) {
    throw new Error(JSON.stringify(data));
  }

  const body = await data.json();
  return body;
}

module.exports = deleteServiceConfig;
