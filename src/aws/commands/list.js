const configDir = require("../utils/configDir");
const configExists = require("../utils/validateConfig");
const Table = require("cli-table3");
const getFromTable = require("../api/dynamoDB/getFromTable");
require("dotenv").config({ path: `${configDir}/.env` });

const list = async () => {
  if (!configExists()) {
    console.log('Config not found. Run "campion setup" to start.');
    return;
  }

  const services = await getFromTable("SERVICES_CONFIG");

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
      `https://${process.env.AWS_DOMAIN_NAME}/service?id=${currService.ID}`,
    ]);
  }

  console.log(table.toString());
};

module.exports = list;
