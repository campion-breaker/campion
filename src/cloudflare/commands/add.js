const update = require("../api/putServicesConfig");
const loadingBar = require("../utils/loadingBar");
const configExists = require("../utils/validateConfig");
const servicePromptConfig = require("../utils/servicePromptConfig");
const logChangeEvent = require("../api/logChangeEvent");

const addSuccessMsg = (service, url) => {
  console.log(
    `\nService '${service}' now protected at ${process.env.SUBDOMAIN}${url}`
  );
};

const buildConfigChangeKey = (service) => {
  return {
    ...service,
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
    await logChangeEvent(buildConfigChangeKey(newState));
    newState.UPDATED_TIME = Date.now();
    await update(newState);
    clearInterval(addId);
    addSuccessMsg(newState.NAME, newState.ID);
  } catch (e) {
    clearInterval(addId);
    console.log(e.message);
  }
};

module.exports = add;
