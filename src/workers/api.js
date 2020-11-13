const fetch = require("node-fetch");
const FormData = require("form-data");
const configDir = require("/src/utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

async function getAccountId() {
  const data = await fetch("https://api.cloudflare.com/client/v4/accounts", {
    headers: {
      "X-Auth-Email": process.env.EMAIL,
      "X-Auth-Key": process.env.APIKEY,
      "Content-Type": "application/json",
    },
  });

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

  const body = await data.json();
  return body.result;
}

async function createNamespace() {
  const accountId = await getAccountId();
  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces`,
    {
      method: "POST",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Testing123" }),
    }
  );
  const body = await data.json();
}

async function writeToNamespace() {
  const accountId = await getAccountId();
  const namespaces = await getNamespaceIds(accountId);
  const namespaceId = namespaces.filter((kv) => kv.title === "Testing123")[0]
    .id;

  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/hello`,
    {
      method: "PUT",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({ title: "hi", what: "testing" }),
    }
  );
  const body = await data.json();
  console.log(body);
}

async function createWorkerWithKVBinding() {
  const accountId = await getAccountId();
  const newWorkerId = "campion";
  const scriptData =
    "addEventListener('fetch', hello => { hello.respondWith(fetch(hello.request)) })";
  const metadata = {
    body_part: "script",
    bindings: [
      {
        type: "kv_namespace",
        name: "hello",
        namespace_id: "25e577f693eb4c6291e25bd26bec0865",
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

  const body = await data.json();
  console.log(body);
}

module.exports = async function deploy() {
  await createNamespace();
  await createWorkerWithKVBinding();
}
