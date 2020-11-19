#!/usr/bin/env node

const { program } = require("commander");

program.version("0.0.1");

program
  .command("s")
  .alias("setup")
  .description("Configure Campion with Cloudflare Email and Global API Key")
  .action(() => require("../src/commands/setup")());

program
  .command("a")
  .alias("add")
  .description("Protect a new endpoint")
  .action(() => require("../src/commands/add")());

program
  .command("l")
  .alias("list")
  .description("List all protected services")
  .action(() => require("../src/commands/list")());

program
  .command("u")
  .alias("update")
  .description("Update the config parameters for a single endpoint")
  .action(() => require("../src/commands/update")());

program
  .command("d")
  .alias("delete")
  .description("Delete a service from Campion")
  .action(() => require("../src/commands/delete")());

program
  .command("f")
  .alias("flip")
  .description("Manually flip the state of a service's circuit breaker")
  .action(() => require("../src/commands/flip")());

program
  .command("stats")
  .description("View Campion stats in a browser window.")
  .action(() => require("../src/commands/stats")());

program.parse(process.argv);
