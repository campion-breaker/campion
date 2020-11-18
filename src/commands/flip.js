const prompt = require("prompts");
const getAllServicesConfigs = require("../utils/getAllServicesConfigs");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const loadingBar = require("../utils/loadingBar");
const updateServicesConfig = require("../workers/api/updateServicesConfig");
require("dotenv").config({ path: `${configDir}/.env` });

const flipSuccessMsg = (service, newState) => {
  console.log(`\n'${service}' is now ${newState}.`);
};

const questions = (choices) => {
  return {
    type: "select",
    name: "SERVICE",
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
  const states = ["CLOSED", "OPEN", "HALF-OPEN"];

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
        description: "The service is unavailable to all traffic.",
      },
      {
        title: "HALF-OPEN",
        value: "HALF-OPEN",
        description:
          "The breaker will let a portion of traffic through to the service.",
      },
    ],
    initial,
  };

  const newState = await prompt(questions);
  state.CIRCUIT_STATE = newState.CIRCUIT_STATE;

  return state;
};

const flip = async () => {
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
  const newState = await flipStatePrompt(chosenService.SERVICE);

  const updateId = loadingBar(
    `\nFlipping '${newState.SERVICE_NAME}' to ${newState.CIRCUIT_STATE}.`
  );

  try {
    await updateServicesConfig(newState);
    clearInterval(updateId);
    flipSuccessMsg(newState.SERVICE_NAME, newState.CIRCUIT_STATE);
  } catch (e) {
    clearInterval(updateId);
    console.log(e.message);
  }
};

module.exports = flip;