const { lambda } = require('../sdk');
const configDir = require('../../utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });

const deleteFunction = () => {
  const params = {
    FunctionName: process.env.AWS_FUNCTION_NAME,
  };

  return lambda.deleteFunction(params, (e) => {
    if (e) {
      throw '\nAll versions of distributed Lambda could not be deleted. Try again in a few hours.';
    }
  }).promise();
};

module.exports = deleteFunction;
