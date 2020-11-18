const fetch = require("node-fetch");
const configDir = require("../../utils/configDir");
const writeIdToEnv = require("../../utils/writeIdToEnv");
require("dotenv").config({ path: `${configDir}/.env` });

async function getNamespaceIds() {
  const accountId = process.env.ACCOUNT_ID;
  let requestLog;
  let servicesConfig;
  let events;
  let traffic;

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
      requestLog = body.result.find((obj) => obj.title === "REQUEST_LOG");
      servicesConfig = body.result.find(
        (obj) => obj.title === "SERVICES_CONFIG"
      );
      events = body.result.find(obj => obj.title === "EVENTS");
      traffic = body.result.find(obj => obj.title === "TRAFFIC");
    }

    if (requestLog) {
      writeIdToEnv("REQUEST_LOG_ID", requestLog.id);
    }
    if (servicesConfig) {
      writeIdToEnv("SERVICES_CONFIG_ID", servicesConfig.id);
    }
    if (events) {
      writeIdToEnv("EVENTS_ID", events.id);
    }
    if (traffic) {
      writeIdToEnv("TRAFFIC_ID", traffic.id);
    }
  } else {
    throw new Error(`\nUnable to retrieve KV Namespaces.`);
  }
}

const createNewKVNamespace = async (name) => {
  const accountId = process.env.ACCOUNT_ID;
  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`,
    {
      method: "POST",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: name }),
    }
  );

  if (data.ok) {
    const body = await data.json();
    writeIdToEnv(name + '_ID', body.result.id);
  } else {
    throw new Error(
      `\nFailed to build KV Namespace. Please try again.`
    );
  }
};

async function createNamespace() {
  await getNamespaceIds();

  if (!process.env.REQUEST_LOG_ID) {
    await createNewKVNamespace('REQUEST_LOG');
  }
  if (!process.env.SERVICES_CONFIG_ID) {
    await createNewKVNamespace('SERVICES_CONFIG');
  }
  if (!process.env.EVENTS_ID) {
    await createNewKVNamespace('EVENTS');
  }
  if (!process.env.TRAFFIC_ID) {
    await createNewKVNamespace('TRAFFIC');
  }
}

module.exports = createNamespace;


