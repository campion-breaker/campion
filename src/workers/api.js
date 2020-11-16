const fetch = require("node-fetch");
const FormData = require("form-data");
const configDir = require("../utils/configDir");
const fs = require("fs");
const absolutePath = require("../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

const writeAccountIdToFile = (acctId) => {
  process.env.ACCOUNT_ID = acctId;
  fs.appendFileSync(`${absolutePath}/.env`, `\nACCOUNT_ID=${acctId}`);
};

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
  const acctId = body.result[0].id;
  writeAccountIdToFile(acctId);
}

const writeNamespaceIdToFile = (name, id) => {
  process.env[name] = id;
  fs.appendFileSync(`${absolutePath}/.env`, `\n${name}=${id}`);
};

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

    writeNamespaceIdToFile("REQUEST_LOG_ID", requestLogId);
    writeNamespaceIdToFile("SERVICES_CONFIG_ID", servicesConfigId);

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

async function createWorkerWithKVBinding() {
  const accountId = process.env.ACCOUNT_ID;
  const newWorkerId = "campion";
  const scriptData = fs.readFileSync(`${__dirname}/circuitBreaker.js`, "utf8");
  const metadata = {
    body_part: "script",
    bindings: [
      {
        type: "kv_namespace",
        name: "REQUEST_LOG",
        namespace_id: process.env.REQUEST_LOG_ID,
      },
      {
        type: "kv_namespace",
        name: "SERVICES_CONFIG",
        namespace_id: process.env.SERVICES_CONFIG_ID,
      },
    ],
  };

  const form = new FormData();
  form.append("metadata", JSON.stringify(metadata));
  form.append("script", scriptData);

  const uploadWorker = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${newWorkerId}/`,
    {
      method: "PUT",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
      },
      body: form,
    }
  );

  if (!uploadWorker.ok) {
    throw new Error(
      `\nFailed to deploy Campion to Cloudflare. Please try again.`
    );
  }

  const deployToWorkersDev = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${newWorkerId}/subdomain`,
    {
      method: "POST",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled: true }),
    }
  );

  if (!deployToWorkersDev.ok) {
    throw new Error(
      `\nFailed to publish Campion to Cloudflare. Please try again.`
    );
  }
}

exports.getAccountId = getAccountId;
exports.createNamespace = createNamespace;
exports.createWorkerWithKVBinding = createWorkerWithKVBinding;
