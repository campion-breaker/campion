const configDir = require("./configDir");
require("dotenv").config({ path: `${configDir}/.env` });

const validateConfig = () => {
  return (
    !!process.env.APIKEY &&
    !!process.env.EMAIL &&
    !!process.env.ACCOUNT_ID &&
    !!process.env.REQUEST_LOG_ID &&
    !!process.env.SERVICES_CONFIG_ID &&
    !!process.env.SUBDOMAIN
  );
};

module.exports = validateConfig;
