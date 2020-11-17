const fetch = require("node-fetch");
const FormData = require("form-data");
const configDir = require("../../utils/configDir");
const fs = require("fs");
require("dotenv").config({ path: `${configDir}/.env` });

async function createWorkerWithKVBinding() {
  const accountId = process.env.ACCOUNT_ID;
  const newWorkerId = "campion";
  const scriptData = fs.readFileSync(`${__dirname}/../circuitBreaker.js`, "utf8");
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

module.exports = createWorkerWithKVBinding;
