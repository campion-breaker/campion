const { spawn } = require('child_process');
const open = require('open');
const configExists = require('../utils/validateConfig');

const stats = () => {
  if (!configExists()) {
    console.log('Config not found. Run "campion setup" to start.');
    return;
  }

  const server = spawn('start_aws_server');
  server.stdout.on('data', (data) => {
    console.log(`${data}`);
    (async () => await open('http://localhost:7777'))();
  });
};

module.exports = stats;

