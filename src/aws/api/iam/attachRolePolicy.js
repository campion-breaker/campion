const { iam } = require('../sdk');

const attachRolePolicy = (policyArn, roleName) => {
  const params = {
    PolicyArn: policyArn,
    RoleName: roleName,
  };

  return iam.attachRolePolicy(params).promise();
};

module.exports = attachRolePolicy;
