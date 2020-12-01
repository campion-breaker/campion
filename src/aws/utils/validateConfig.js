const configDir = require("./configDir");
require("dotenv").config({ path: `${configDir}/.env` });

const validateConfig = () => {
  return (
    !!process.env.AWS_ACCESS_KEY_ID &&
    !!process.env.AWS_SECRET_KEY &&
    !!process.env.AWS_ROLE_ARN &&
    !!process.env.AWS_LAMBDA_ARN &&
    !!process.env.AWS_DOMAIN_NAME
  );
};

module.exports = validateConfig;
