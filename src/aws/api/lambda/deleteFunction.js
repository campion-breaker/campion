const { lambda } = require('../sdk');

const deleteFunction = () => {
  const params = {
    FunctionName: process.env.AWS_FUNCTION_NAME,
  };

  return lambda.deleteFunction(params).promise();
};

module.exports = deleteFunction;
