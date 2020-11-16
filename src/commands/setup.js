const deploy = require("../workers/api");
const fs = require("fs");
const prompt = require("prompts");
const absolutePath = require("../utils/configDir");

const createHiddenCampionDir = () => {
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath);
  }
};

const configMsg = () => {
  console.log("Campion Config:\n");
};

const startRibbon = () => {
  process.stdout.write("\nDeploying");
  return setInterval(() => {
    process.stdout.write(".");
  }, 300);
};

const configGoodbye = () => {
  console.log(
    "\nSetup complete. Run 'campion add' to add a new service endpoint."
  );
};

const retrieveExistingValues = () => {
  const existingENV = fs
    .readFileSync(`${absolutePath}/.env`, "utf8")
    .split("\n");

  const apiKey = existingENV[0].slice(7);
  const email = existingENV[1].slice(6);

  return [apiKey, email];
};

const promptUser = async (apiKey, email) =>
  await prompt(questions(apiKey, email));

  
const writeToFile = ({ apiKey, email }) => {
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
    const [apiKey, email] = retrieveExistingValues();
    writeToFile(await promptUser(apiKey, email));
  } catch (e) {
    writeToFile(await promptUser());
  }

  const ribbonId = startRibbon();
  try {
    await deploy();
    clearInterval(ribbonId);
    configGoodbye();
  } catch (e) {
    clearInterval(ribbonId);
    console.log(e.message);
  }
};

module.exports = setup;
