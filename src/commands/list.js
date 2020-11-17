const getServiceConfig = require('../workers/api/getServiceConfig');
const getAllServices = require('../workers/api/getAllServices');
const configDir = require('../utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });
const Table = require('cli-table3');

const table = new Table({
  head: ['Name', 'Circuit State', 'Campion Endpoint'],
});

const list = async () => {
  const services = await getAllServices();
  let serviceNames = [];

  for (let i = 0; i < services.length; i++) {
    const service = await getServiceConfig(services[i].name);
    table.push([
      service.SERVICE_NAME,
      service.CIRCUIT_STATE,
      process.env.SUBDOMAIN + service.SERVICE,
    ]);
  }

  console.log(table.toString());
};

module.exports = list;
