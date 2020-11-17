const getAllServicesConfigs = require('../utils/getAllServicesConfigs');
const configDir = require('../utils/configDir');
const configExists = require('../utils/validateConfig');
const Table = require('cli-table3');
require('dotenv').config({ path: `${configDir}/.env` });

const list = async () => {
  if (!configExists()) {
    console.log('Config not found. Run "campion setup" to start.');
    return;
  }

  const table = new Table({
    head: ['Name', 'Circuitbreaker', 'Campion Endpoint'],
  });

  const services = await getAllServicesConfigs();

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
