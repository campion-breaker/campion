#!/usr/bin/env node

const minimist = require("minimist");
const argv = minimist(process.argv.slice(2), {});

switch (argv._[0]) {
  case "setup":
    require("../src/commands/setup")();
    break;
  case "new":
  case "add":
    require("../src/commands/add")();
    break;
  default:
    console.log("help");
    break;
}
