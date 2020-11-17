const prompt = require("prompts");
const getAllServicesConfigs = require("../utils/getAllServicesConfigs");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const loadingBar = require("../utils/loadingBar");
const servicePromptConfig = require("../utils/servicePromptConfig");
const updateServicesConfig = require("../workers/api/updateServicesConfig");
require("dotenv").config({ path: `${configDir}/.env` });

const updateSuccessMsg = (service) => {
  console.log(`\nService '${service}' successfully updated.`);
};

const questions = (choices) => {
  return {
    type: "select",
    name: "SERVICE",
    message: "Which service would you like to update? ",
    choices,
  };
};

const selectService = async (services) => {
  const choices = services.map((service) => {
    return {
      title: service.SERVICE_NAME,
      value: service.SERVICE,
      description: service.SERVICE,
    };
  });

  const chosenService = await prompt(questions(choices));
  return chosenService;
};

const serviceConfig = (services, chosenService) => {
  return services.find((service) => service.SERVICE === chosenService.SERVICE);
};

const update = async () => {
  if (!configExists()) {
    console.log('Config not found. Run "campion setup" to start.');
    return;
  }

  let services;
  const retrieveId = loadingBar("Retrieving services ");

  try {
    services = await getAllServicesConfigs();
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
  const chosenServiceConfig = serviceConfig(services, chosenService);
  const newState = await servicePromptConfig(chosenServiceConfig);

  if (!(Object.keys(newState).length === 10)) {
    console.log("\nService update aborted.");
    return;
  }

  const updateId = loadingBar(`\nUpdating '${newState.SERVICE_NAME}' `);

  try {
    await updateServicesConfig(newState);
    clearInterval(updateId);
    updateSuccessMsg(newState.SERVICE_NAME);
  } catch (e) {
    clearInterval(updateId);
    console.log(e.message);
  }
};

module.exports = update;
