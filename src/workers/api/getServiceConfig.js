const fetch = require("node-fetch");
const configDir = require("../../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

async function getServiceConfig(keyName) {
  const accountId = process.env.ACCOUNT_ID;
  const namespaceId = process.env.SERVICES_CONFIG_ID;
  keyName = keyName.replace(/\//g, "%2F");

  const data = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${keyName}`, {
    method: 'GET',
    headers: {
      "X-Auth-Email": process.env.EMAIL,
      "X-Auth-Key": process.env.APIKEY,
    }
  });

  const body = await data.json();
  if (body.SERVICE) {
    return body;
  } else {
    return null;
  }
}

module.exports = getServiceConfig;
