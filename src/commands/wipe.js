const prompt = require("prompts");
const configDir = require("../utils/configDir");
const {
  deleteWorker,
  deleteNamespace,
} = require("../workers/api/wipeCloudflare");
const loadingBar = require("../utils/loadingBar");
const fs = require("fs");
require("dotenv").config({ path: `${configDir}/.env` });

const wipeSuccessMsg = () => {
  console.log(
    `\nAll Cloudflare information successfully deleted. Run 'campion setup' to redeploy.`
  );
};

const confirm = () => {
  return {
    type: "confirm",
    name: "value",
    message: `Confirm deletion of Campion from Cloudflare.\n  This will erase all Circuit Breakers, settings, and protected endpoints.\n  This action cannot be undone.\n  Are you sure?`,
    initial: false,
  };
};

const wipe = async () => {
  const confirmation = await prompt(confirm());

  if (!confirmation.value) {
    console.log("Campion deletion aborted.");
    return;
  }

  const deleteServiceId = loadingBar(`\nDeleting Campion `);

  try {
    await deleteWorker();
    await deleteNamespace(process.env.REQUEST_LOG_ID);
    await deleteNamespace(process.env.SERVICES_CONFIG_ID);
    await deleteNamespace(process.env.EVENTS_ID);
    await deleteNamespace(process.env.TRAFFIC_ID);
    fs.rmdirSync(configDir, { recursive: true });
    clearInterval(deleteServiceId);
    wipeSuccessMsg();
  } catch (e) {
    clearInterval(deleteServiceId);
    console.log(e.message);
  }
};

module.exports = wipe;
