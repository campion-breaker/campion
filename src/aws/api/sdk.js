const AWS = require('aws-sdk');
const configDir = require('../utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });

function sdk() {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: 'us-east-1',
  });

  const iam = new AWS.IAM();
  const ddb = new AWS.DynamoDB();
  const lambda = new AWS.Lambda();
  const cloudFront = new AWS.CloudFront();

  return {
    iam,
    ddb,
    lambda,
    cloudFront,
  };
}

module.exports = sdk;
