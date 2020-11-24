const prompt = require("prompts");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const loadingBar = require("../utils/loadingBar");
const deleteServiceConfig = require("../workers/api/deleteServiceConfig");
const getAllServicesConfigs = require("../utils/getAllServicesConfigs");
const getAllKeys = require("../workers/api/getAllKeys");
const deleteAllKeys = require("../workers/api/deleteAllKeys");
require("dotenv").config({ path: `${configDir}/.env` });

const deleteServiceSuccessMsg = (service) => {
  console.log(`\nService '${service}' successfully deleted.`);
};

const questions = (choices) => {
  return {
    type: "select",
    name: "ID",
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
      title: service.NAME,
      value: service,
      description: service.ID,
    };
  });

  const service = await prompt(questions(choices));
  return service.ID;
};

const deleteService = async () => {
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
    console.log("\nNo services found.");
    return;
  }

  const chosenService = await selectService(services);
  const confirmation = await prompt(confirm(chosenService.NAME));

  if (!confirmation.value) {
    console.log("Delete aborted.");
    return;
  }

  const deleteServiceId = loadingBar(
    `\nDeleting '${chosenService.NAME}' `
  );

  const events = await getAllKeys('EVENTS_ID', true);
  const chosenServiceEvents = events.filter((event) => 
    event.includes(chosenService.ID)
  );
  const traffic = await getAllKeys('TRAFFIC_ID', true);
  const chosenServiceTraffic = traffic.filter((obj) =>
    obj.includes(chosenService.ID)
  );

  try {
    await deleteAllKeys('EVENTS_ID', chosenServiceEvents);
    await deleteAllKeys('TRAFFIC_ID', chosenServiceTraffic);
    await deleteServiceConfig(chosenService.ID);
    clearInterval(deleteServiceId);
    deleteServiceSuccessMsg(chosenService.NAME);
  } catch (e) {
    clearInterval(deleteServiceId);
    console.log(e.message);
  }
};

module.exports = deleteService;
