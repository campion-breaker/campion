const fetch = require('node-fetch');
const configDir = require('../../utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });

async function getAllKeys(namespace) {
  const acctId = process.env.ACCOUNT_ID;
  const namespaceId = process.env[namespace];

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${acctId}/storage/kv/namespaces/${namespaceId}/keys`,
    {
      method: 'GET',
      headers: {
        'X-Auth-Email': process.env.EMAIL,
        'X-Auth-Key': process.env.APIKEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (data.ok) {
    const body = await data.json();
    return body.result.map((key) => JSON.parse(key.name));
  } else {
    throw new Error(`\nUnable to retrives ${namespace} keys.`);
  }
}

module.exports = getAllKeys;
