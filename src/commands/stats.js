const { spawn } = require('child_process');
const open = require('open');

const stats = () => {
  const server = spawn('start_server');
  server.stdout.on('data', (data) => {
    console.log(`${data}`);
    (async () => await open('http://localhost:7777'))();
  });
};

module.exports = stats;
