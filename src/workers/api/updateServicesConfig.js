const fetch = require("node-fetch");
const configDir = require("../../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

async function getAccountId() {
  const data = await fetch("https://api.cloudflare.com/client/v4/accounts", {
    headers: {
      "X-Auth-Email": process.env.EMAIL,
      "X-Auth-Key": process.env.APIKEY,
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) throw new Error("\nInvalid Credentials.");

  const body = await data.json();

  return body.result[0].id;
}

async function getNamespaceIds(accountId) {
  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`,
    {
      method: "GET",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (!data.ok) {
    throw new Error(`\nUnable to retrieve KV Namespaces.`);
  }

  const body = await data.json();
  return body.result;
}

async function updateServiceConfig(state) {
  const accountId = await getAccountId();
  const namespaces = await getNamespaceIds(accountId);
  const namespaceId = namespaces.filter(
    (kv) => kv.title === "SERVICES_CONFIG"
  )[0].id;

  const serviceId = state.SERVICE_NAME;

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${serviceId}`,
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
