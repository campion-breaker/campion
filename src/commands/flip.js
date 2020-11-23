const prompt = require("prompts");
const getAllServicesConfigs = require("../utils/getAllServicesConfigs");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const loadingBar = require("../utils/loadingBar");
const putServicesConfig = require("../workers/api/putServicesConfig");
const logChangeEvent = require("../workers/api/logChangeEvent");
require("dotenv").config({ path: `${configDir}/.env` });

const flipSuccessMsg = (service, newState) => {
  console.log(`\n'${service}' successfully set to ${newState}.`);
};

const questions = (choices) => {
  return {
    type: "select",
    name: "ID",
    message: "Which service's state would you like to flip? ",
    choices,
  };
};

const selectService = async (services) => {
  const choices = services.map((service) => {
    return {
      title: service.NAME,
      value: service,
      description: `${service.CIRCUIT_STATE} at '${service.ID}`,
    };
  });

  const chosenService = await prompt(questions(choices));

  return chosenService.ID;
};

const flipStatePrompt = async (state) => {
  const states = ["CLOSED", "OPEN", "HALF-OPEN", "FORCED-OPEN"];
  const initial = states.indexOf(state.CIRCUIT_STATE);

  const questions = {
    type: "select",
    name: "CIRCUIT_STATE",
    message: "Set the current state of the Breaker: ",
    choices: [
      {
        title: "CLOSED",
        value: "CLOSED",
        description: "The service is available to all traffic.",
      },
      {
        title: "OPEN",
        value: "OPEN",
        description: `The service is unavailable to all traffic for ${state.ERROR_TIMEOUT} (ERROR_TIMEOUT) seconds.`,
      },
      {
        title: "HALF-OPEN",
        value: "HALF-OPEN",
        description:
          "The breaker will let a portion of traffic through to the service.",
      },
      {
        title: "FORCED-OPEN",
        value: "FORCED-OPEN",
        description:
          "The service is unavailable to all traffic until breaker is manually reopened.",
      },
    ],
    initial,
  };

  const newState = await prompt(questions);
  if (newState.CIRCUIT_STATE) {
    state.CIRCUIT_STATE = newState.CIRCUIT_STATE;
  }

  return newState.CIRCUIT_STATE;
};

const buildEventStateChangeKey = (service, newState) => {
  const stateChangeEntry = {
    ID: service.ID,
    EVENT: "STATE_CHANGE",
    TIME: Date.now(),
    OLD_STATE: service.CIRCUIT_STATE,
    NEW_STATE: newState,
    MODE: "FLIP",
  };

  return JSON.stringify(stateChangeEntry);
};

const flip = async () => {
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

  if (Object.keys(chosenService).length === 0) {
    console.log("\nCircuit flip aborted.");
    return;
  }

  const newState = await flipStatePrompt({ ...chosenService });
  console.log(newState, chosenService);

  if (Object.keys(newState).length === 0) {
    console.log("\nCircuit flip aborted.");
    return;
  } else {
    chosenService.CIRCUIT_STATE = newState;
  }

  await logChangeEvent(buildEventStateChangeKey(chosenService, newState));

  const updateId = loadingBar(
    `\nFlipping '${chosenService.NAME}' to ${newState} `
  );

  try {
    await putServicesConfig(chosenService);
    clearInterval(updateId);
    flipSuccessMsg(chosenService.NAME, chosenService.CIRCUIT_STATE);
  } catch (e) {
    clearInterval(updateId);
    console.log(e.message);
  }
};

module.exports = flip;
