const getAccountId = require('../workers/api/getAccountId');
const createNamespace = require('../workers/api/createNamespace');
const createWorkerWithKVBinding = require('../workers/api/createWorkerWithKVBinding');
const fs = require('fs');
const prompt = require('prompts');
const absolutePath = require('../utils/configDir');
const loadingBar = require('../utils/loadingBar');
const getWorkersDevSubdomain = require('../workers/api/getWorkersDevSubdomain');

const createHiddenCampionDir = () => {
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath);
  }
};

const configMsg = () => {
  console.log('Campion Config:\n');
};

const configGoodbye = () => {
  console.log(
    "\nSetup complete. Run 'campion add' to add a new service endpoint."
  );
};

const promptUser = async (apiKey, email) =>
  await prompt(questions(apiKey, email));

const clearExistingIds = () => {
  process.env.ACCOUNT_ID = '';
  process.env.TRAFFIC_ID = '';
  process.env.EVENTS_ID = '';
  process.env.REQUEST_LOG_ID = '';
  process.env.SERVICES_CONFIG_ID = '';
  process.env.SUBDOMAIN = '';
};

const writeToFile = ({ apiKey, email }) => {
  process.env.APIKEY = apiKey;
  process.env.EMAIL = email;

  clearExistingIds();

  fs.writeFileSync(`${absolutePath}/.env`, `APIKEY=${apiKey}\nEMAIL=${email}`);
  fs.writeFileSync(
    `${__dirname}/../../front_end/app/.env`,
    `REACT_APP_APIKEY=${apiKey}\nREACT_APP_EMAIL=${email}`
  );
};

const questions = (apiKey, email) => [
  {
    type: 'text',
    name: 'email',
    message: 'Enter the email associated with your Cloudflare account:',
    initial: email || '',
  },
  {
    type: 'text',
    name: 'apiKey',
    message: 'Enter your Cloudflare Global API Key:',
    initial: apiKey || '',
  },
];

const deploy = async () => {
  const deployId = loadingBar('Deploying ');
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

  console.log('\nCanceled. Campion setup aborted.');
};

module.exports = setup;
