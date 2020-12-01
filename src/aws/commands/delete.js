const prompt = require("prompts");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const loadingBar = require("../../cloudflare/utils/loadingBar");
const deleteFromTable = require("../api/dynamoDB/deleteFromTable");
const getFromTable = require("../api/dynamoDB/getFromTable");

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

  const services = await getFromTable("SERVICES_CONFIG");

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

  const deleteServiceId = loadingBar(`\nDeleting '${selected.NAME}' `);

  try {
    const events = await getFromTable("EVENTS");
    const selectedEvents = events.filter((event) =>
      event.ID.includes(selected.ID)
    );
    const traffic = await getFromTable("TRAFFIC");
    const selectedTraffic = traffic.filter((obj) =>
      obj.ID.includes(selected.ID)
    );
    await deleteFromTable("EVENTS", selectedEvents);
    await deleteFromTable("TRAFFIC", selectedTraffic);
    await deleteFromTable("SERVICES_CONFIG", selected);
    clearInterval(deleteServiceId);
    deleteServiceSuccessMsg(selected.NAME);
  } catch (e) {
    clearInterval(deleteServiceId);
    console.log(`\n${e.message}`);
  }
};

module.exports = deleteService;
