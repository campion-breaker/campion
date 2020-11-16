const startLoadingBar = (message) => {
  process.stdout.write(`\n${message}`);
  return setInterval(() => {
    process.stdout.write(" ☀️");
  }, 300);
};

module.exports = startLoadingBar;
