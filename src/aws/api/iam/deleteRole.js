const sdk = require("../sdk");

const deleteRole = (RoleName) => {
  const params = {
    RoleName,
  };

  return sdk().iam.deleteRole(params).promise();
};

module.exports = deleteRole;
