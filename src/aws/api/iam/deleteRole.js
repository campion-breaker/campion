const { iam } = require("../sdk");

const deleteRole = (RoleName) => {
  const params = {
    RoleName,
  };

  return iam.deleteRole(params).promise();
};

module.exports = deleteRole;
