const sdk = require("../sdk");
const configDir = require("../../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

const detachRolePolicy = (PolicyArn) => {
  const params = {
    PolicyArn,
    RoleName: process.env.AWS_ROLE_NAME,
  };

  return sdk().iam.detachRolePolicy(params).promise();
};

module.exports = detachRolePolicy;
