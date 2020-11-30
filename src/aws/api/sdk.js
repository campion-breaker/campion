const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: "AKIAJOSKLUPW3E2SNPKA",
  secretAccessKey: "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",
  region: "us-east-1",
});

const iam = new AWS.IAM();
const dynamodb = new AWS.DynamoDB();
const cloudformation = new AWS.CloudFormation();
const lambda = new AWS.Lambda();

const createLambdaRole = (roleName) => {
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Service: ["lambda.amazonaws.com", "edgelambda.amazonaws.com"],
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

const policies = [
  "arn:aws:iam::aws:policy/AWSLambdaFullAccess",
  "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
  "arn:aws:iam::aws:policy/CloudFrontFullAccess",
];

const attachRolePolicy = (policyArn, roleName) => {
  const params = {
    PolicyArn: policyArn,
    RoleName: roleName,
  };

  return iam.attachRolePolicy(params).promise();
};

createLambdaRole("testrole8").then((data) => {
  const one = attachRolePolicy(
    "arn:aws:iam::aws:policy/AWSLambdaFullAccess",
    data.Role.RoleName
  );
  const two = attachRolePolicy(
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
    data.Role.RoleName
  );
  const three = attachRolePolicy(
    "arn:aws:iam::aws:policy/CloudFrontFullAccess",
    data.Role.RoleName
  );
  Promise.all([one, two, three]).then((d) => console.log(d));
});
