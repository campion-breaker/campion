const update = require("../workers/api/updateServicesConfig");

const initialState = {
  CIRCUIT_STATE: "CLOSED",
  ERROR_TIMEOUT: 60,
  MAX_LATENCY: 1000,
  NETWORK_FAILURE_THRESHOLD: 5,
  PERCENT_OF_REQUESTS: 25,
  SERVICE: "https://broken-rice-127c.bziggz.workers.dev/",
  SERVICE_FAILURE_THRESHOLD: 3,
  SUCCESS_THRESHOLD: 2,
  TIMESPAN: 60,
};

const add = () => {
  update(initialState);
};

module.exports = add;
