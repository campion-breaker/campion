const prompt = require("prompts");
const getAllServicesConfigs = require("../utils/getAllServicesConfigs");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const loadingBar = require("../utils/loadingBar");
const putServicesConfig = require("../workers/api/putServicesConfig");
const servicePromptConfig = require("../utils/servicePromptConfig");
const logChangeEvent = require("../workers/api/logChangeEvent");
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

  let services;
  const retrieveId = loadingBar("Retrieving services ");

  try {
    services = await getAllServicesConfigs("SERVICES_CONFIG_ID");
    clearInterval(retrieveId);
    console.log("\n");
  } catch (e) {
    clearInterval(retrieveId);
    console.log(e.message);
  }

  if (services.length === 0) {
    console.log('\nNo services found. Run "campion add" to add a service.');
    return;
  }

  const chosenService = await selectService(services);

  const newState = await servicePromptConfig(chosenService);

  if (!newState || !(Object.keys(newState).length === 10)) {
    console.log("\nService update aborted.");
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
