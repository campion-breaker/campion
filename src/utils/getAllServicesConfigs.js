const getServiceConfig = require('../workers/api/getServiceConfig');
const getAllKeys = require('../workers/api/getAllKeys');

const getAllServicesConfigs = async () => {
  const services = await getAllKeys('SERVICES_CONFIG_ID');
  let serviceNames = [];

  for (let i = 0; i < services.length; i++) {
    const service = await getServiceConfig(services[i].name);
    serviceNames.push(service);
  }

  return serviceNames;
};

module.exports = getAllServicesConfigs;
