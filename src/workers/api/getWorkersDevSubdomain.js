const fetch = require('node-fetch');
const configDir = require('../../utils/configDir');
const writeIdToEnv = require('../../utils/writeIdToEnv');
require('dotenv').config({ path: `${configDir}/.env` });

const getWorkersDevSubdomain = async () => {
  const acctId = process.env.ACCOUNT_ID;

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${acctId}/workers/subdomain`,
    {
      headers: {
        'X-Auth-Email': process.env.EMAIL,
        'X-Auth-Key': process.env.APIKEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!data.ok) {
    throw new Error('\nGET worker subdomain failed.\n' + data.statusText);
  }

  const body = await data.json();
  writeIdToEnv(
    'SUBDOMAIN',
    `https://campion.${body.result.subdomain}.workers.dev/service?id=`
  );
};

module.exports = getWorkersDevSubdomain;
