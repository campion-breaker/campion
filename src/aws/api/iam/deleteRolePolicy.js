const { iam } = require('../sdk');
const configDir = require('../utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });

const deleteRolePolicy = (PolicyName) => {
  const params = {
    PolicyName,
    RoleName: process.env.AWS_ROLE_NAME,
  };

  return iam.deleteRolePolicy.promise();
};

module.exports = deleteRolePolicy;
