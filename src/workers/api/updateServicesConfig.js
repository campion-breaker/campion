const fetch = require("node-fetch");
const configDir = require("../../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

async function updateServiceConfig(state) {
  const accountId = process.env.ACCOUNT_ID;
  const configId = process.env.SERVICES_CONFIG_ID;
  let serviceId = state.SERVICE.replace(/\//g, '%2F');

  if (serviceId.slice(-3) === '%2F') {
    serviceId = serviceId.slice(0, -3);
  }

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

  const body = await data.json();
}

module.exports = updateServiceConfig;
