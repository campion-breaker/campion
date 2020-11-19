const putServicesConfig = require('../workers/api/putServicesConfig');
const deleteServicesConfig = require('../workers/api/deleteServicesConfig');

const updateServicesConfig = async (oldConfig, newConfig) => {
  await deleteServicesConfig(oldConfig);
  await putServicesConfig(newConfig);
};

module.exports = updateServicesConfig;
