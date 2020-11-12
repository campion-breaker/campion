const fs = require('fs');
const prompt = require('prompt');
prompt.message = '🔆 ';
prompt.delimiter = '';
prompt.colors = false;

const writeToFile = (api, email) => {
  console.log([api, email]); 
};

const promptUser = () => {
  const emailMsg = 'Enter the email associated with your Cloudflare account:';
  const apiMsg = 'Enter your Cloudflare Global API Key:';

  prompt.start();
  prompt.get([emailMsg, apiMsg], (err, result) => {
    writeToFile(result[apiMsg], result[emailMsg]);
  });
};

const welcomeMsg = () => {
  console.log('Welcome to Campion!');
};

const setup = () => {
  welcomeMsg();
  promptUser();
};

module.exports = setup;
