const getServiceConfig = require('../workers/api/getServiceConfig');
const getAllServices = require('../workers/api/getAllServices');

const getAllServicesConfigs = async () => {
  const services = await getAllServices();
  let serviceNames = [];

  for (let i = 0; i < services.length; i++) {
    const service = await getServiceConfig(services[i].name);
    serviceNames.push(service);
  }

  return serviceNames;
};

module.exports = getAllServicesConfigs;
