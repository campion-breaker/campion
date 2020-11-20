const prompt = require('prompts');
const getAllKeys = require('../workers/api/getAllKeys');
const configDir = require('../utils/configDir');
const configExists = require('../utils/validateConfig');
const loadingBar = require('../utils/loadingBar');
const servicePromptConfig = require('../utils/servicePromptConfig');
const updateServicesConfig = require('../utils/updateServicesConfig');
const logChangeEvent = require('../workers/api/logChangeEvent');
require('dotenv').config({ path: `${configDir}/.env` });

const updateSuccessMsg = (service) => {
  console.log(`\nService '${service}' successfully updated.`);
};

const questions = (choices) => {
  return {
    type: 'select',
    name: 'SERVICE',
    message: 'Which service would you like to update? ',
    choices,
  };
};

const selectService = async (services) => {
  const choices = services.map((service) => {
    return {
      title: service.SERVICE_NAME,
      value: service,
      description: service.SERVICE,
    };
  });

  const chosenService = await prompt(questions(choices));
  return chosenService.SERVICE;
};

const buildConfigChangeKey = (service) => {
  const key = {
    ...service,
    EVENT: 'CONFIG_CHANGE',
    TIME: Date.now(),
    METHOD: 'UPDATE',
  };

  return JSON.stringify(key);
};

const update = async () => {
  if (!configExists()) {
    console.log('Config not found. Run "campion setup" to start.');
    return;
  }

  let services;
  const retrieveId = loadingBar('Retrieving services ');

  try {
    services = await getAllKeys('SERVICES_CONFIG_ID');
    clearInterval(retrieveId);
    console.log('\n');
  } catch (e) {
    clearInterval(retrieveId);
    console.log(e.message);
  }

  if (services.length === 0) {
    console.log('\nNo services found. Run "campion add" to add a service.');
    return;
  }

  const chosenService = await selectService(services);
  const originalService = { ...chosenService };
  const newState = await servicePromptConfig(chosenService);

  if (!(Object.keys(newState).length === 10)) {
    console.log('\nService update aborted.');
    return;
  }

  const updateId = loadingBar(`\nUpdating '${newState.SERVICE_NAME}' `);

  try {
    await updateServicesConfig(originalService, newState);
    await logChangeEvent(buildConfigChangeKey(newState));
    clearInterval(updateId);
    updateSuccessMsg(newState.SERVICE_NAME);
  } catch (e) {
    clearInterval(updateId);
    console.log(e.message);
  }
};

module.exports = update;
