const getServiceConfig = require("../workers/api/getServiceConfig");
const getAllServices = require("../workers/api/getAllServices");

const list = async () => {
  const services = await getAllServices();
  let serviceNames = [];

  for (let i = 0; i < services.length; i++) {
    const service = await getServiceConfig(services[i].name);
    serviceNames.push(service);
  }

  console.log(serviceNames);
};

module.exports = list;
