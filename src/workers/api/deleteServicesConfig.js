const fetch = require('node-fetch');
const configDir = require('../../utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });

async function deleteServicesConfig(serviceName) {
  const accountId = process.env.ACCOUNT_ID;
  const namespaceId = process.env.SERVICES_CONFIG_ID;
  serviceName = { ...serviceName };
  serviceName.SERVICE = serviceName.SERVICE.replace(/\//g, '%2F');
  serviceName = JSON.stringify(serviceName);

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${serviceName}`,
    {
      method: 'DELETE',
      headers: {
        'X-Auth-Email': process.env.EMAIL,
        'X-Auth-Key': process.env.APIKEY,
      },
    }
  );

  const body = await data.json();
  if (body.SERVICE) {
    return body;
  } else {
    return null;
  }
}

module.exports = deleteServicesConfig;
