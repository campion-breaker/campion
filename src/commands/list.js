const getAllServicesConfigs = require("../utils/getAllServicesConfigs");
const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const Table = require("cli-table3");
const loadingBar = require("../utils/loadingBar");
require("dotenv").config({ path: `${configDir}/.env` });

const list = async () => {
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

  const table = new Table({
    head: ["Name", "Circuitbreaker State", "Campion Endpoint"],
  });

  for (let i = 0; i < services.length; i++) {
    const currService = services[i];
    table.push([
      currService.SERVICE_NAME,
      currService.CIRCUIT_STATE,
      process.env.SUBDOMAIN + currService.SERVICE,
    ]);
  }

  console.log(table.toString());
};

module.exports = list;
