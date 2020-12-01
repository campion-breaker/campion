const prompt = require("prompts");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const loadingBar = require("../../cloudflare/utils/loadingBar");
const putToTable = require("../api/dynamoDB/putToTable");
const servicePromptConfig = require("../../cloudflare/utils/servicePromptConfig");
const getFromTable = require("../api/dynamoDB/getFromTable");
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
  const serviceCopy = { ...service };
  serviceCopy.ID = service.ID + Date.now();

  return {
    ...serviceCopy,
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

  const services = await getFromTable("SERVICES_CONFIG");

  if (!services) {
    return;
  }

  const chosenService = await selectService(services);

  if (!chosenService) {
    console.log("Update aborted");
    return;
  }

  const newState = await servicePromptConfig(chosenService);

  if (!newState || Object.keys(newState).length !== 10) {
    console.log("\nUpdate aborted.");
    return;
  }

  const updateId = loadingBar(`\nUpdating '${newState.NAME}' `);

  try {
    await putToTable("EVENTS", buildConfigChangeKey(newState));
    await putToTable("SERVICES_CONFIG", newState);
    clearInterval(updateId);
    updateSuccessMsg(newState.NAME);
  } catch (e) {
    clearInterval(updateId);
    console.log(e.message);
  }
};

module.exports = update;
