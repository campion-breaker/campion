const {
  getAccountId,
  createNamespace,
  createWorkerWithKVBinding,
} = require("../workers/api");
const fs = require("fs");
const prompt = require("prompts");
const absolutePath = require("../utils/configDir");
const loadingBar = require("../utils/loadingBar");

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

const setup = async () => {
  createHiddenCampionDir();
  configMsg();

  try {
    const apiKey = process.env.APIKEY;
    const email = process.env.EMAIL;

    writeToFile(await promptUser(apiKey, email));
  } catch (e) {
    writeToFile(await promptUser());
  }

  const setupId = loadingBar("Deploying");
  try {
    try {
      await getAccountId();
      await createNamespace();
      await createWorkerWithKVBinding();
    } catch (e) {
      throw new Error(e.message);
    }
    clearInterval(setupId);
    configGoodbye();
  } catch (e) {
    clearInterval(setupId);
    console.log(e.message);
  }
};

module.exports = setup;
