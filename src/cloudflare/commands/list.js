const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const Table = require("cli-table3");
const getListOfServices = require("../utils/getListOfServices");
require("dotenv").config({ path: `${configDir}/.env` });

const list = async () => {
  if (!configExists()) {
    console.log('Config not found. Run "campion setup" to start.');
    return;
  }

  const services = await getListOfServices();

  if (!services) {
    return;
  }

  const table = new Table({
    head: ["Name", "Circuit Breaker State", "Campion Endpoint"],
  });

  for (let i = 0; i < services.length; i++) {
    const currService = services[i];
    table.push([
      currService.NAME,
      currService.CIRCUIT_STATE,
      process.env.SUBDOMAIN + currService.ID,
    ]);
  }

  console.log(table.toString());
};

module.exports = list;
