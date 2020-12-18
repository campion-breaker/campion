const sdk = require('../sdk');
const configDir = require('../../utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });

const deleteFunction = () => {
  const params = {
    FunctionName: process.env.AWS_FUNCTION_NAME,
  };

  return sdk().lambda.deleteFunction(params).promise();
};

module.exports = deleteFunction;
