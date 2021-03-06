const getServiceConfig = require("../api/getServiceConfig");
const getAllKeys = require("../api/getAllKeys");

const getAllServicesConfigs = async () => {
  const services = await getAllKeys("SERVICES_CONFIG_ID");
  const configs = [];

  for (let i = 0; i < services.length; i += 1) {
    configs.push(await getServiceConfig(services[i]));
  }
  return configs;
};

module.exports = getAllServicesConfigs;
