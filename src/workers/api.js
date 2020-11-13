const fetch = require("node-fetch");
const FormData = require("form-data");
const configDir = require("../utils/configDir");
const fs = require("fs");
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

async function updateServiceConfig(newState) {
  const accountId = await getAccountId();
  const namespaces = await getNamespaceIds(accountId);
  const namespaceId = namespaces.filter(
    (kv) => kv.title === "SERVICES_CONFIG"
  )[0].id;

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values`,
    {
      method: "PUT",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(newState || initialState),
    }
  );

  if (!data.ok) {
    throw new Error(`\nFailed to update 'SERVICES_CONFIG'. Please try again.`);
  }

  const body = await data.json();
}

async function createNamespace(title) {
  const accountId = await getAccountId();
  const namespaces = await getNamespaceIds(accountId);

  if (!namespaces.find((obj) => (obj.title = title))) {
    const data = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`,
      {
        method: "POST",
        headers: {
          "X-Auth-Email": process.env.EMAIL,
          "X-Auth-Key": process.env.APIKEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      }
    );

    if (!data.ok) {
      throw new Error(
        `\nFailed to build KV Namespace '${title}'. Please try again.`
      );
    }
  }
}

async function createWorkerWithKVBinding() {
  const accountId = await getAccountId();
  const newWorkerId = "campion";
  const scriptData = fs.readFileSync(`${__dirname}/circuitBreaker.js`, "utf8");
  const namespaceIds = await getNamespaceIds(accountId);
  const metadata = {
    body_part: "script",
    bindings: [
      {
        type: "kv_namespace",
        name: "REQUEST_LOG",
        namespace_id: namespaceIds.find((obj) => obj.title === "REQUEST_LOG")
          .id,
      },
      {
        type: "kv_namespace",
        name: "SERVICES_CONFIG",
        namespace_id: namespaceIds.find(
          (obj) => obj.title === "SERVICES_CONFIG"
        ).id,
      },
    ],
  };

  const form = new FormData();
  form.append("metadata", JSON.stringify(metadata));
  form.append("script", scriptData);

  const data = await fetch(
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

  if (!data.ok) {
    throw new Error(
      `\nFailed to deploy Campion to Cloudflare. Please try again.`
    );
  }
}

async function deploy() {
  try {
    await createNamespace("REQUEST_LOG");
    await createNamespace("SERVICES_CONFIG");
    await createWorkerWithKVBinding();
  } catch (e) {
    throw new Error(e.message);
  }
}

module.exports = deploy;
