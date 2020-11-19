const fetch = require("node-fetch");
const configDir = require("../../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

const logChangeEvent = async (key) => {
  const acctId = process.env.ACCOUNT_ID;
  const eventsNamespaceId = process.env.EVENTS_ID;
  const data = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${acctId}/storage/kv/namespaces/${eventsNamespaceId}/values/${key}`,
    {
      method: "PUT",
      headers: {
        "X-Auth-Email": process.env.EMAIL,
        "X-Auth-Key": process.env.APIKEY,
        "Content-Type": "text/plain",
      },
    }
  );

  if (!data.ok) {
    throw new Error("Failed to log Change Event to 'EVENTS' namespace.");
  }
};

module.exports = logChangeEvent;
