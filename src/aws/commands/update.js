const prompt = require("prompts");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const loadingBar = require("../utils/loadingBar");
const putServicesConfig = require("../api/putServicesConfig");
const servicePromptConfig = require("../utils/servicePromptConfig");
const logChangeEvent = require("../api/logChangeEvent");
const getListOfServices = require("../utils/getListOfServices");
require("dotenv").config({ path: `${configDir}/.env` });

const updateSuccessMsg = (service) => {
  console.log(`\nService '${service}' successfully updated.`);
};

const questions = (choices) => {
  return {
    type: "select",
    name: "ID",
    message: "Which service would you like to update? ",
    choices,
  };
};

const selectService = async (services) => {
  const choices = services.map((service) => {
    return {
      title: service.NAME,
      value: service,
      description: service.ID,
    };
  });

  const chosenService = await prompt(questions(choices));
  return chosenService.ID;
};

const buildConfigChangeKey = (service) => {
  return {
    ...service,
    EVENT: "CONFIG_CHANGE",
    TIME: Date.now(),
    METHOD: "UPDATE",
  };
};

const update = async () => {
  if (!configExists()) {
    console.log('Config not found. Run "campion setup" to start.');
    return;
  }

  const services = await getListOfServices();

  if (!services) {
    return;
  }

  const chosenService = await selectService(services);

  if (!chosenService) {
    console.log("Update aborted");
    return;
  }

  const newState = await servicePromptConfig(chosenService);

  if (!newState || !(Object.keys(newState).length === 10)) {
    console.log("\nUpdate aborted.");
    return;
  }

  const updateId = loadingBar(`\nUpdating '${newState.NAME}' `);

  try {
    await logChangeEvent(buildConfigChangeKey(newState));
    await putServicesConfig(newState);
    clearInterval(updateId);
    updateSuccessMsg(newState.NAME);
  } catch (e) {
    clearInterval(updateId);
    console.log(e.message);
  }
};

module.exports = update;
