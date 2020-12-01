const loadingBar = require("./loadingBar");
const getAllServicesConfigs = require("./getAllServicesConfigs");

const getListOfServices = async () => {
  const retrieveId = loadingBar("Retrieving services ");
  let services;

  try {
    services = await getAllServicesConfigs("SERVICES_CONFIG_ID");
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
  
  return services;
};

module.exports = getListOfServices;
