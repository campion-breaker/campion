const fetch = require('node-fetch');
const configDir = require('../../utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });

const logEventStateChange = async (key) => {
  const acctId = process.env.ACCOUNT_ID;
  const eventsNamespaceId = process.env.EVENTS_ID;
  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${acctId}/storage/kv/namespaces/${eventsNamespaceId}/values/${key}`,
    {
      method: 'PUT',
      headers: {
        'X-Auth-Email': process.env.EMAIL,
        'X-Auth-Key': process.env.APIKEY,
        'Content-Type': 'text/plain',
      },
    }
  );
};

module.exports = logEventStateChange;
