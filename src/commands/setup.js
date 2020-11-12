const fs = require("fs");
const prompt = require("prompts");
prompt.message = "🔆 ";
prompt.delimiter = "";
prompt.colors = false;

const configMsg = () => {
  console.log("Campion Config\n");
};

const configGoodbye = () => {
  console.log("Setup complete.");
};

const retrieveExistingValues = () => {
  const existingENV = fs.readFileSync("../../.env", "utf8").split("\n");

  const apiKey = existingENV[0].slice(7);
  const email = existingENV[1].slice(6);

  return [apiKey, email];
};

const promptUser = async (apiKey, email) =>
  await prompt(questions(apiKey, email));

const writeToFile = ({ apiKey, email }) => {
  fs.writeFileSync("../../.env", `APIKEY=${apiKey}\nEMAIL=${email}`);
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
  configMsg();

  try {
    const [apiKey, email] = retrieveExistingValues();
    writeToFile(await promptUser(apiKey, email));
  } catch (e) {
    writeToFile(await promptUser());
  }

  configGoodbye();
};

module.exports = setup;
