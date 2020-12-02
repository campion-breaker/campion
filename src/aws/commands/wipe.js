const prompt = require("prompts");
const loadingBar = require("../../cloudflare/utils/loadingBar");
const fs = require("fs");
const deleteTable = require("../api/dynamoDB/deleteTable");
const deleteFunction = require("../api/lambda/deleteFunction");
const deleteDistribution = require("../api/cloudFront/deleteDistribution");
const deleteRole = require("../api/iam/deleteRole");
const detachRolePolicy = require("../api/iam/detachRolePolicy");
const configDir = require("../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });

const wipeSuccessMsg = () => {
  console.log(
    `\nAll AWS information successfully deleted. Run 'campionaws setup' to redeploy.`
  );
};

const confirm = () => {
  return {
    type: "confirm",
    name: "value",
    message: `Confirm deletion of Campion from AWS.\n  This will erase all Circuit Breakers, settings, and protected endpoints.\n  This action cannot be undone.\n  Are you sure?`,
    initial: false,
  };
};

const resetEnvFile = () => {
  const envKeys = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_KEY",
    "AWS_ROLE_ARN",
    "AWS_ROLE_NAME",
    "AWS_FUNCTION_NAME",
    "AWS_LAMBDA_ARN",
    "AWS_DOMAIN_NAME",
    "AWS_CLOUDFRONT_ID",
    "AWS_SERVICES_CONFIG",
    "AWS_REQUEST_LOG",
    "AWS_EVENTS",
    "AWS_TRAFFIC",
  ];

  const result = envKeys
    .map((key) => `${key}=${process.env[key] || ""}`)
    .join("\n");

  fs.writeFileSync(`${configDir}/.env`, result);
};

const deleteExistingTable = async (tableName) => {
  const tableARN = process.env[`AWS_${tableName}`];

  if (tableARN) {
    const data = await deleteTable(tableName);
    const status = data.TableDescription.TableStatus;

    if (status !== "DELETING") {
      throw `Something went wrong deleting ${tableName}. Please try again.`;
    } else {
      process.env[`AWS_${tableName}`] = "";
    }
  }
};

const deleteAllExistingTables = async () => {
  await deleteExistingTable("SERVICES_CONFIG");
  await deleteExistingTable("EVENTS");
  await deleteExistingTable("TRAFFIC");
  await deleteExistingTable("REQUEST_LOG");
};

const deleteExistingRole = async () => {
  const roleName = process.env.AWS_ROLE_NAME;

  if (roleName) {
    await detachRolePolicy("arn:aws:iam::aws:policy/AWSLambdaFullAccess");
    await detachRolePolicy("arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess");
    await detachRolePolicy("arn:aws:iam::aws:policy/CloudFrontFullAccess");
    await deleteRole(roleName);
    process.env.AWS_ROLE_NAME = "";
    process.env.AWS_ROLE_ARN = "";
  }
};

const deleteExistingDistribution = async () => {
  const distributionId = process.env.AWS_CLOUDFRONT_ID;

  if (distributionId) {
    await deleteDistribution(distributionId);
    process.env.AWS_CLOUDFRONT_ID = "";
    process.env.AWS_DOMAIN_NAME = "";
  }
};

const deleteExistingFunction = async () => {
  const lambdaArn = process.env.AWS_LAMBDA_ARN;

  if (lambdaArn) {
    await deleteFunction();
    process.env.AWS_LAMBDA_ARN = "";
    process.env.AWS_FUNCTION_NAME = "";
  }
};

const deleteEnv = () => {
  if (!process.env.AWS_LAMBDA_ARN && !process.env.AWS_FUNCTION_NAME) {
    fs.rmdirSync(configDir, { recursive: true });
  }
};

const wipe = async () => {
  const confirmation = await prompt(confirm());

  if (!confirmation.value) {
    console.log("Campion deletion aborted.");
    return;
  }

  const deleteServiceId = loadingBar(`\nDeleting Campion `);

  try {
    await deleteExistingRole();
    await deleteAllExistingTables();
    await deleteExistingDistribution();
    await deleteExistingFunction();
    deleteEnv();
    clearInterval(deleteServiceId);
    wipeSuccessMsg();
  } catch (e) {
    clearInterval(deleteServiceId);
    console.log(`\n${e.message}`);
  } finally {
    resetEnvFile();
  }
};

module.exports = wipe;
