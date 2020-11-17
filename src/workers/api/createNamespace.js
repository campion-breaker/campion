const fetch = require("node-fetch");
const configDir = require("../../utils/configDir");
const writeIdToEnv = require("../../utils/writeIdToEnv");
require("dotenv").config({ path: `${configDir}/.env` });

async function getNamespaceIds(accountId) {
  let requestLogId;
  let servicesConfigId;
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

  if (data.ok) {
    const body = await data.json();
    if (body.result.length > 0) {
      requestLogId = body.result.find((obj) => obj.title === "REQUEST_LOG").id;
      servicesConfigId = body.result.find(
        (obj) => obj.title === "SERVICES_CONFIG"
      ).id;
    }

    writeIdToEnv("REQUEST_LOG_ID", requestLogId);
    writeIdToEnv("SERVICES_CONFIG_ID", servicesConfigId);

  } else {
    throw new Error(`\nUnable to retrieve KV Namespaces.`);
  }
}

async function createNamespace() {
  const accountId = process.env.ACCOUNT_ID;
  await getNamespaceIds(accountId);

  if (!process.env.REQUEST_LOG_ID || !process.env.SERVICES_CONFIG_ID) {
    const data = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`,
      {
        method: "POST",
        headers: {
          "X-Auth-Email": process.env.EMAIL,
          "X-Auth-Key": process.env.APIKEY,
          "Content-Type": "application/json",
        },
        body: { "title": "REQUEST_LOG" },
      }
    );

    if (data.ok) {

      console.log(data)
    } else {
      throw new Error(
        `\nFailed to build KV Namespace. Please try again.`
      );
    }
  }
}

module.exports = createNamespace;
