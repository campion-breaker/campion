const fetch = require("node-fetch");
const configDir = require("../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

async function deleteWorker() {
  const accountId = process.env.ACCOUNT_ID;

  const deleteWorker = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/campion/`,
    {
      method: "DELETE",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
      },
    }
  );

  if (!deleteWorker.ok) {
    throw new Error(
      `\nFailed to delete Campion from Cloudflare. Please try again.`
    );
  }
}

async function deleteNamespace(namespaceId) {
  const accountId = process.env.ACCOUNT_ID;

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`,
    {
      method: "DELETE",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
      },
    }
  );

  if (!data.ok) {
    throw new Error(`\nFailed to delete KV Namespace. Please try again.`);
  }
}

exports.deleteWorker = deleteWorker;
exports.deleteNamespace = deleteNamespace;
