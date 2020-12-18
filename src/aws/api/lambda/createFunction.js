const sdk = require('../sdk');
const fs = require('fs');

const createFunction = (name) => {
  const code = fs.readFileSync(`${__dirname}/../../circuitBreaker.zip`);

  const params = {
    Description: 'Campion Circuit-Breaker',
    FunctionName: name,
    Publish: true,
    Handler: 'index.handler',
    Runtime: 'nodejs12.x',
    Role: process.env.AWS_ROLE_ARN,
    Code: {
      ZipFile: code,
    },
  };

  return sdk().lambda.createFunction(params).promise();
};

module.exports = createFunction;
