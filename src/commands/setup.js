const fs = require("fs");
const prompt = require("prompt");
prompt.message = "🔆 ";
prompt.delimiter = "";
prompt.colors = false;

const writeToFile = (api, email) => {
  fs.writeFileSync("../../.env", `APIKEY=${api}\nEMAIL=${email}`);
};

const promptUser = () => {
  const emailMsg = "Enter the email associated with your Cloudflare account:";
  const apiMsg = "Enter your Cloudflare Global API Key:";

  prompt.start();
  prompt.get([emailMsg, apiMsg], (err, result) => {
    writeToFile(result[apiMsg], result[emailMsg]);
    configGoodbye();
  });
};

const configMsg = () => {
  console.log("Campion Config");
};

const configGoodbye = () => {
  console.log("Setup complete.");
};

const setup = () => {
  configMsg();
  promptUser();
};

module.exports = setup;
