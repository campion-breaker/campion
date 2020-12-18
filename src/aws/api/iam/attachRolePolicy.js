const sdk = require('../sdk');

const attachRolePolicy = (policyArn, roleName) => {
  const params = {
    PolicyArn: policyArn,
    RoleName: roleName,
  };

  return sdk().iam.attachRolePolicy(params).promise();
};

module.exports = attachRolePolicy;
