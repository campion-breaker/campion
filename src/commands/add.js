const update = require('../workers/api/updateServicesConfig');
const loadingBar = require('../utils/loadingBar');
const configExists = require('../utils/validateConfig');
const servicePromptConfig = require('../utils/servicePromptConfig');
const logEventStateChange = require('../workers/api/logEventStateChange');

const addSuccessMsg = (service, url) => {
  console.log(
    `\nService '${service}' now protected at ${process.env.SUBDOMAIN}${url}`
  );
};

const buildEventStateChangeKey = (service) => {
  return `@CONFIG_CHANGE@TIME=${Date.now()}@${JSON.stringify(service)}@ADD`;
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

  const addId = loadingBar(`\nProtecting ${newState.SERVICE_NAME} `);
  try {
    await update(newState);
    await logEventStateChange(buildEventStateChangeKey(newState));
    clearInterval(addId);
    addSuccessMsg(newState.SERVICE_NAME, newState.SERVICE);
  } catch (e) {
    clearInterval(addId);
    console.log(e.message);
  }
};

module.exports = add;
