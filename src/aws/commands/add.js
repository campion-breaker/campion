const putToTable = require("../api/dynamoDB/putToTable");
const loadingBar = require("../../cloudflare/utils/loadingBar");
const configExists = require("../utils/validateConfig");
const servicePromptConfig = require("../../cloudflare/utils/servicePromptConfig");

const addSuccessMsg = (service, url) => {
  console.log(
    `\nService '${service}' now protected at https://${process.env.AWS_DOMAIN_NAME}/service?id=${url}`
  );
};

const buildConfigChangeKey = (service) => {
  const serviceCopy = { ...service };
  serviceCopy.ID = service.ID + "_" + Date.now();

  return {
    ...serviceCopy,
    EVENT: "CONFIG_CHANGE",
    TIME: Date.now(),
    METHOD: "ADD",
  };
};

const add = async () => {
  if (!configExists()) {
    console.log('Config not found. Run "campion setup" to start.');
    return;
  }

  const newState = await servicePromptConfig();

  if (!(Object.keys(newState).length === 10)) {
    console.log(`\nService protection aborted.`);
    return;
  }

  const addId = loadingBar(`\nProtecting ${newState.NAME} `);
  try {
    await putToTable("EVENTS", buildConfigChangeKey(newState));
    newState.UPDATED_TIME = Date.now();
    await putToTable("SERVICES_CONFIG", newState);
    clearInterval(addId);
    addSuccessMsg(newState.NAME, newState.ID);
  } catch (e) {
    clearInterval(addId);
    console.log(e.message);
  }
};

module.exports = add;
