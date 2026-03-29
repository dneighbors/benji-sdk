import { Command } from "commander";
import { ensureAuth } from "../auth.js";

export function registerStubCommand(
  program: Command,
  name: string,
  description: string,
  verbs: string[]
): void {
  const cmd = program
    .command(name)
    .description(description)
    .addHelpText(
      "after",
      `\nExamples:\n${verbs.map((v) => `  $ benji ${name} ${v}`).join("\n")}`
    );

  for (const verb of verbs) {
    const capitalized = verb.charAt(0).toUpperCase() + verb.slice(1);
    cmd
      .command(verb)
      .description(`${capitalized} ${name}`)
      .addHelpText("after", `\nExamples:\n  $ benji ${name} ${verb}`)
      .action(() => {
        ensureAuth();
        console.error("Not yet implemented. Coming in Story 6.2.");
        process.exit(2);
      });
  }
}
