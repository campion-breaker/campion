const fs = require("fs");
const prompt = require("prompts");
const loadingBar = require("../../cloudflare/utils/loadingBar");
const configDir = require("../utils/configDir");
require("dotenv").config({ path: `${configDir}/.env` });
const writeToEnv = require("../utils/writeToEnv");
const createFunction = require("../api/lambda/createFunction");
const createTable = require("../api/dynamoDB/createTable");
const createCloudFront = require("../api/cloudFront/createCloudFront");
const createRole = require("../api/iam/createRole");
const attachRolePolicy = require("../api/iam/attachRolePolicy");

const createHiddenCampionDir = () => {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }
};

const configMsg = () => {
  console.log("Campion AWS Config:\n");
};

const configGoodbye = () => {
  console.log(
    "\nSetup complete. Run 'campion add' to add a new service endpoint."
  );
};

const promptUser = async (accessKeyId, secretAccessKey) =>
  await prompt(questions(accessKeyId, secretAccessKey));

const writeToFile = ({ accessKeyId, secretAccessKey }) => {
  process.env.AWS_ACCESS_KEY_ID = accessKeyId;
  process.env.AWS_SECRET_KEY = secretAccessKey;

  fs.writeFileSync(
    `${configDir}/.env`,
    `AWS_ACCESS_KEY_ID=${accessKeyId}\nAWS_SECRET_KEY=${secretAccessKey}`
  );
};

const questions = (accessKeyId, secretAccessKey) => [
  {
    type: "text",
    name: "accessKeyId",
    message: "Enter AWS Access Key:",
    initial: accessKeyId || "",
  },
  {
    type: "text",
    name: "secretAccessKey",
    message: "Enter your secret access key:",
    initial: secretAccessKey || "",
  },
];

const createAllTablesAndCheckSuccess = async () => {
  const tableCreation1 = await createTable("SERVICES_CONFIG");
  const tableCreation2 = await createTable("REQUEST_LOG");
  const tableCreation3 = await createTable("EVENTS");
  const tableCreation4 = await createTable("TRAFFIC");
  const tableArn1 = tableCreation1.TableDescription.TableArn;
  const tableArn2 = tableCreation2.TableDescription.TableArn;
  const tableArn3 = tableCreation3.TableDescription.TableArn;
  const tableArn4 = tableCreation4.TableDescription.TableArn;

  if (tableArn1) writeToEnv("AWS_SERVICES_CONFIG", tableArn1);
  if (tableArn2) writeToEnv("AWS_REQUEST_LOG", tableArn2);
  if (tableArn3) writeToEnv("AWS_EVENTS", tableArn3);
  if (tableArn4) writeToEnv("AWS_TRAFFIC", tableArn4);

  if (!tableArn1 || !tableArn2 || !tableArn3 || !tableArn4) {
    throw "There was a problem setting up Campion. Please run campionaws wipe and try again.";
  }
};

const createFunctionAndCheckSuccess = async (name) => {
  writeToEnv("AWS_FUNCTION_NAME", name);
  const lambdaData = await createFunction(name);
  const functionArn = lambdaData.FunctionArn;

  if (functionArn) {
    writeToEnv("AWS_LAMBDA_ARN", functionArn + `:${lambdaData.Version}`);
  } else {
    throw "There was a problem setting up Campion. Please run campionaws wipe and try again.";
  }
};

const createCloudFrontAndCheckSuccess = async () => {
  const cloudfrontData = await createCloudFront();
  const domainName = cloudfrontData.Distribution.DomainName;
  const id = cloudfrontData.Distribution.Id;

  if (domainName && id) {
    writeToEnv("AWS_DOMAIN_NAME", domainName);
    writeToEnv("AWS_CLOUDFRONT_ID", id);
  } else {
    throw "There was a problem setting up Campion. Please run campionaws wipe and try again.";
  }
};

const deploy = async () => {
  const deployId = loadingBar("Deploying ");
  try {
    if (!process.env.AWS_ROLE_ARN && !process.env.AWS_ROLE_NAME) {
      await createRole("campion").then(async (data) => {
        await attachRolePolicy(
          "arn:aws:iam::aws:policy/AWSLambdaFullAccess",
          "campion"
        );
        await attachRolePolicy(
          "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
          "campion"
        );
        await attachRolePolicy(
          "arn:aws:iam::aws:policy/CloudFrontFullAccess",
          "campion"
        );
        writeToEnv("AWS_ROLE_ARN", data.Role.Arn);
        writeToEnv("AWS_ROLE_NAME", data.Role.RoleName);
      });
    } else {
      writeToEnv("AWS_ROLE_NAME", process.env.AWS_ROLE_NAME);
      writeToEnv("AWS_ROLE_ARN", process.env.AWS_ROLE_ARN);
    }

    await new Promise(async (resolve) => {
      setTimeout(async () => {
        try {
          if (!process.env.AWS_SERVICES_CONFIG && !process.env.AWS_REQUEST_LOG
            && !process.env.AWS_EVENTS && !process.env.AWS_TRAFFIC) {
            await createAllTablesAndCheckSuccess();
          } else {
            writeToEnv("AWS_SERVICES_CONFIG", process.env.AWS_SERVICES_CONFIG);
            writeToEnv("AWS_REQUEST_LOG", process.env.AWS_REQUEST_LOG);
            writeToEnv("AWS_EVENTS", process.env.AWS_EVENTS);
            writeToEnv("AWS_TRAFFIC", process.env.AWS_TRAFFIC);
          }

          if (!process.env.AWS_FUNCTION_NAME || !process.env.AWS_LAMBDA_ARN) {
            await createFunctionAndCheckSuccess("campion14");
          } else {
            writeToEnv("AWS_FUNCTION_NAME", process.env.AWS_FUNCTION_NAME);
            writeToEnv("AWS_LAMBDA_ARN", process.env.AWS_LAMBDA_ARN);
          }

          if (!process.env.AWS_CLOUDFRONT_ID && !process.env.AWS_DOMAIN_NAME) {
            await createCloudFrontAndCheckSuccess();
          } else {
            writeToEnv("AWS_CLOUDFRONT_ID", process.env.AWS_CLOUDFRONT_ID);
            writeToEnv("AWS_DOMAIN_NAME", process.env.AWS_DOMAIN_NAME);
          }

          resolve();
        } catch (e) {
          clearInterval(deployId);
          console.log(`\n${e.message}`);
          return;
        }
      }, 10000);
    });

    clearInterval(deployId);
  } catch (e) {
    clearInterval(deployId);
    throw e;
  }
};

const setup = async () => {
  createHiddenCampionDir();

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_KEY;

  configMsg();

  const userInput =
    accessKeyId && secretAccessKey
      ? await promptUser(accessKeyId, secretAccessKey)
      : await promptUser();

  if (userInput.accessKeyId && userInput.secretAccessKey) {
    try {
      writeToFile(userInput);
      await deploy();
      configGoodbye();
    } catch (e) {
      console.log(`\n${e.message}`);
    }
    return;
  }

  console.log("\nCanceled. Campion setup aborted.");
};

module.exports = setup;
