const getAccountId = require("../workers/api/getAccountId");
const createNamespace = require("../workers/api/createNamespace");
const createWorkerWithKVBinding = require("../workers/api/createWorkerWithKVBinding");
const fs = require("fs");
const prompt = require("prompts");
const absolutePath = require("../utils/configDir");
const loadingBar = require("../utils/loadingBar");
const getWorkersDevSubdomain = require("../workers/api/getWorkersDevSubdomain");

const createHiddenCampionDir = () => {
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath);
  }
};

const configMsg = () => {
  console.log("Campion Config:\n");
};

const configGoodbye = () => {
  console.log(
    "\nSetup complete. Run 'campion add' to add a new service endpoint."
  );
};

const promptUser = async (apiKey, email) =>
  await prompt(questions(apiKey, email));

const writeToFile = ({ apiKey, email }) => {
  process.env.APIKEY = apiKey;
  process.env.EMAIL = email;
  fs.writeFileSync(`${absolutePath}/.env`, `APIKEY=${apiKey}\nEMAIL=${email}`);
};

const questions = (apiKey, email) => [
  {
    type: "text",
    name: "email",
    message: "Enter the email associated with your Cloudflare account:",
    initial: email || "",
  },
  {
    type: "text",
    name: "apiKey",
    message: "Enter your Cloudflare Global API Key:",
    initial: apiKey || "",
  },
];

const deploy = async () => {
  const deployId = loadingBar("Deploying");
  try {
    await getAccountId();
    await createNamespace();
    await createWorkerWithKVBinding();
    await getWorkersDevSubdomain();
    clearInterval(deployId);
    configGoodbye();
  } catch (e) {
    clearInterval(deployId);
    console.log(e.message);
  }
};

const setup = async () => {
  createHiddenCampionDir();

  const apiKey = process.env.APIKEY;
  const email = process.env.EMAIL;

  configMsg();

  const userInput =
    apiKey && email ? await promptUser(apiKey, email) : await promptUser();

  if (userInput.apiKey && userInput.email) {
    writeToFile(userInput);
    await deploy();
    return;
  }

  console.log("\nCanceled. Campion setup aborted.");
};

module.exports = setup;
