const prompt = require("prompts");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const loadingBar = require("../utils/loadingBar");
const deleteServiceConfig = require("../api/deleteServiceConfig");
const getListOfServices = require("../utils/getListOfServices");
const getAllKeys = require("../api/getAllKeys");
const deleteAllKeys = require("../api/deleteAllKeys");
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

  const services = await getListOfServices();

  if (!services) {
    return;
  }

  const selected = await selectService(services);

  if (!selected) {
    console.log("Delete aborted.");
    return;
  }

  const confirmation = await prompt(confirm(selected.NAME));

  if (!confirmation) {
    console.log("Delete aborted.");
    return;
  }

  const deleteServiceId = loadingBar(
    `\nDeleting '${selected.NAME}' `
  );

  try {
    const events = await getAllKeys('EVENTS_ID', true);
    const selectedEvents = events.filter((event) => 
      event.includes(selected.ID)
    );
    const traffic = await getAllKeys('TRAFFIC_ID', true);
    const selectedTraffic = traffic.filter((obj) =>
      obj.includes(selected.ID)
    );
    await deleteAllKeys('EVENTS_ID', selectedEvents);
    await deleteAllKeys('TRAFFIC_ID', selectedTraffic);
    await deleteServiceConfig(selected.ID);
    clearInterval(deleteServiceId);
    deleteServiceSuccessMsg(selected.NAME);
  } catch (e) {
    clearInterval(deleteServiceId);
    console.log(e.message);
  }
};

module.exports = deleteService;
