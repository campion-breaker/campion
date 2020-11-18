const prompt = require('prompts');
const getAllServicesConfigs = require('../utils/getAllServicesConfigs');
const configDir = require('../utils/configDir');
const configExists = require('../utils/validateConfig');
const loadingBar = require('../utils/loadingBar');
const updateServicesConfig = require('../workers/api/updateServicesConfig');
const logEventStateChange = require('../workers/api/logEventStateChange');
require('dotenv').config({ path: `${configDir}/.env` });

const flipSuccessMsg = (service, newState) => {
  console.log(`\n'${service}' successfully set to ${newState}.`);
};

const questions = (choices) => {
  return {
    type: 'select',
    name: 'SERVICE',
    message: "Which service's state would you like to flip? ",
    choices,
  };
};

const selectService = async (services) => {
  const choices = services.map((service) => {
    return {
      title: service.SERVICE_NAME,
      value: service,
      description: `${service.CIRCUIT_STATE} at '${service.SERVICE}`,
    };
  });

  const chosenService = await prompt(questions(choices));

  return chosenService;
};

const flipStatePrompt = async (state) => {
  const states = ['CLOSED', 'OPEN', 'HALF-OPEN', 'FORCED-OPEN'];
  const initial = states.indexOf(state.CIRCUIT_STATE);

  const questions = {
    type: 'select',
    name: 'CIRCUIT_STATE',
    message: 'Set the current state of the Breaker: ',
    choices: [
      {
        title: 'CLOSED',
        value: 'CLOSED',
        description: 'The service is available to all traffic.',
      },
      {
        title: 'OPEN',
        value: 'OPEN',
        description: `The service is unavailable to all traffic for ${state.ERROR_TIMEOUT} (ERROR_TIMEOUT) seconds.`,
      },
      {
        title: 'HALF-OPEN',
        value: 'HALF-OPEN',
        description:
          'The breaker will let a portion of traffic through to the service.',
      },
      {
        title: 'FORCED-OPEN',
        value: 'FORCED-OPEN',
        description:
          'The service is unavailable to all traffic until breaker is manually reopened.',
      },
    ],
    initial,
  };

  const newState = await prompt(questions);
  if (newState.CIRCUIT_STATE) {
    state.CIRCUIT_STATE = newState.CIRCUIT_STATE;
  }

  return newState;
};

const buildEventStateChangeKey = (service, newState) => {
  return `@STATE_CHANGE@ID=${service.SERVICE}@TIME=${Date.now()}@OLD_STATE=${
    service.CIRCUIT_STATE
  }@NEW_STATE=${newState}@MODE=manual`;
};

const flip = async () => {
  if (!configExists()) {
    console.log('Config not found. Run "campion setup" to start.');
    return;
  }

  let services;
  const retrieveId = loadingBar('Retrieving services ');

  try {
    services = await getAllServicesConfigs();
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

  if (Object.keys(chosenService).length === 0) {
    console.log('\nCircuit flip aborted.');
    return;
  }

  const newState = await flipStatePrompt({ ...chosenService.SERVICE });

  if (Object.keys(newState).length === 0) {
    console.log('\nCircuit flip aborted.');
    return;
  } else {
    chosenService.SERVICE.CIRCUIT_STATE = newState.CIRCUIT_STATE;
  }

  await logEventStateChange(
    buildEventStateChangeKey(chosenService.SERVICE, newState.CIRCUIT_STATE)
  );

  const updateId = loadingBar(
    `\nFlipping '${chosenService.SERVICE.SERVICE_NAME}' to ${newState.CIRCUIT_STATE} `
  );

  try {
    await updateServicesConfig(chosenService.SERVICE);
    clearInterval(updateId);
    flipSuccessMsg(
      chosenService.SERVICE.SERVICE_NAME,
      chosenService.SERVICE.CIRCUIT_STATE
    );
  } catch (e) {
    clearInterval(updateId);
    console.log(e.message);
  }
};

module.exports = flip;
