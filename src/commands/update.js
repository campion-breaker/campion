const getAllServicesConfigs = require('../utils/getAllServicesConfigs');
const configDir = require('../utils/configDir');
const configExists = require('../utils/validateConfig');
const prompt = require('prompts');
const loadingBar = require('../utils/loadingBar');
const servicePromptConfig = require('../utils/servicePromptConfig');
const updateServicesConfig = require('../workers/api/updateServicesConfig');
require('dotenv').config({ path: `${configDir}/.env` });

const updateSuccessMsg = (service, url) => {
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

const update = async () => {
  if (!configExists()) {
    console.log('Config not found. Run "campion setup" to start.');
    return;
  }

  const services = await getAllServicesConfigs();

  if (services.length === 0) {
    console.log('No services found. Run "campion add" to add a service.');
    return;
  }

  const choices = services.map((service) => {
    return {
      title: service.SERVICE_NAME,
      value: service.SERVICE,
      description: service.SERVICE,
    };
  });

  const chosenService = await prompt(questions(choices));
  const chosenServiceConfig = services.find(
    (service) => service.SERVICE === chosenService.SERVICE
  );

  const newState = await servicePromptConfig(chosenServiceConfig);

  if (!(Object.keys(newState).length === 10)) {
    console.log(`\nService update aborted.`);
    return;
  }

  const updateId = loadingBar(`\nUpdating ${newState.SERVICE_NAME} `);
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
