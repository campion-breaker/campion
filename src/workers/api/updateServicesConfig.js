const fetch = require("node-fetch");
const configDir = require("../../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

async function updateServiceConfig(state) {
  const accountId = process.env.ACCOUNT_ID;
  const configId = process.env.SERVICES_CONFIG_ID;
  const serviceId = state.SERVICE.replace(/\//g, "%2F");

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${configId}/values/${serviceId}/`,
    {
      method: "PUT",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(state),
    }
  );

  if (!data.ok) {
    throw new Error(JSON.stringify(data)); //`\nFailed to update 'SERVICES_CONFIG'. Please try again.`);
  }
}

module.exports = updateServiceConfig;
