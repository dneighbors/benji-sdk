#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "node:module";
import { registerCommands } from "./commands/index.js";
import { handleCommandError } from "./error-handler.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const program = new Command("benji")
  .version(version)
  .description(
    "CLI for the Benji API — manage todos, habits, health tracking, and more"
  )
  .option("--json", "Output results as JSON")
  .showHelpAfterError("Run 'benji --help' for available commands");

registerCommands(program);

program.parseAsync(process.argv).catch((error: unknown) => {
  handleCommandError(error);
});
