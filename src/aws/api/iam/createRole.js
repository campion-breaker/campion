const { iam } = require("../sdk");

const createRole = (roleName) => {
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Service: ["edgelambda.amazonaws.com", "lambda.amazonaws.com"],
        },
        Action: "sts:AssumeRole",
      },
    ],
  };

  const params = {
    AssumeRolePolicyDocument: JSON.stringify(policy),
    RoleName: roleName,
  };

  return iam.createRole(params).promise();
};

module.exports = createRole;
