const prompt = require("prompts");
const getAllServicesConfigs = require("../utils/getAllServicesConfigs");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const loadingBar = require("../utils/loadingBar");
const deleteServiceRequest = require("../workers/api/deleteServiceRequest");
require("dotenv").config({ path: `${configDir}/.env` });

const deleteServiceSuccessMsg = (service) => {
  console.log(`\nService '${service}' successfully deleted.`);
};

const questions = (choices) => {
  return {
    type: "select",
    name: "SERVICE",
    message: "Which service would you like to delete? ",
    choices,
  };
};

const confirm = (choice) => {
  return {
    type: "confirm",
    name: "value",
    message: `Confirm deletion of '${choice}'? This action cannot be reversed.`,
    initial: false,
  };
};

const selectService = async (services) => {
  const choices = services.map((service) => {
    return {
      title: service.SERVICE_NAME,
      value: `${service.SERVICE}&&&${service.SERVICE_NAME}`,
      description: service.SERVICE,
    };
  });

  let chosenService = await prompt(questions(choices));
  chosenService = chosenService.SERVICE.split("&&&");

  return {
    SERVICE: chosenService[0],
    SERVICE_NAME: chosenService[1],
  };
};

const deleteService = async () => {
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
    console.log("\nNo services found.");
    return;
  }

  const chosenService = await selectService(services);
  const confirmation = await prompt(confirm(chosenService.SERVICE_NAME));

  if (!confirmation.value) {
    console.log("Delete aborted.");
    return;
  }

  const deleteServiceId = loadingBar(
    `\nDeleting '${chosenService.SERVICE_NAME}' `
  );

  try {
    await deleteServiceRequest(chosenService.SERVICE);
    clearInterval(deleteServiceId);
    deleteServiceSuccessMsg(chosenService.SERVICE_NAME);
  } catch (e) {
    clearInterval(deleteServiceId);
    console.log(e.message);
  }
};

module.exports = deleteService;
