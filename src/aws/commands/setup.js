const fs = require("fs");
const prompt = require("prompts");
const configDir = require("../utils/configDir");
const loadingBar = require("../../cloudflare/utils/loadingBar");
require("dotenv").config({ path: `${configDir}/.env` });
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

const clearExistingIds = () => {
  // process.env.ACCOUNT_ID = "";
  // process.env.TRAFFIC_ID = "";
  // process.env.EVENTS_ID = "";
  // process.env.REQUEST_LOG_ID = "";
  // process.env.SERVICES_CONFIG_ID = "";
  // process.env.SUBDOMAIN = "";
};

const writeToFile = ({ accessKeyId, secretAccessKey }) => {
  process.env.AWS_ACCESS_KEY_ID = accessKeyId;
  process.env.AWS_SECRET_KEY = secretAccessKey;

  clearExistingIds();

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

const deploy = async () => {
  const deployId = loadingBar("Deploying ");
  try {
    await createRole('campion');
    await attachRolePolicy('arn:aws:iam::aws:policy/AWSLambdaFullAccess', 'campion');
    await attachRolePolicy('arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess', 'campion');
    await attachRolePolicy('arn:aws:iam::aws:policy/CloudFrontFullAccess', 'campion')

    clearInterval(deployId);
    configGoodbye();
  } catch (e) {
    clearInterval(deployId);
    console.log(`\n${e.message}`);
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
    writeToFile(userInput);
    await deploy();
    return;
  }

  console.log("\nCanceled. Campion setup aborted.");
};

module.exports = setup;
