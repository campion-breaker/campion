const { exec } = require("child_process");

const stats = () => {
  exec("start_server", (err, stderr, stdout) => {
    console.log(`stdout: ${stdout}`);
    console.log(`Server is now running at https://${host}:${port}.`);
    console.log("Control + C to quit.");
  });
};

module.exports = stats;
