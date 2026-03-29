import { Command } from "commander";
import { wrapSdkCall, Contacts } from "benji-sdk";
import { ensureAuth } from "../auth.js";
import { getGlobalOptions, outputResult } from "../output.js";
import { handleCommandError } from "../error-handler.js";
import { readStdin, requireForce } from "./shared.js";

export function registerContactsCommand(program: Command): void {
  const cmd = program
    .command("contacts")
    .description("Manage contacts");

  cmd
    .command("list")
    .description("List all contacts")
    .addHelpText("after", `\nExamples:\n  $ benji contacts list\n  $ benji contacts list --json`)
    .action(async (options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(Contacts.contactsList());
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("create")
    .description("Create a contact")
    .argument("[name]", "Contact name")
    .option("--email <email>", "Email address")
    .option("--phone <phone>", "Phone number")
    .option("--birthday <date>", "Birthday (YYYY-MM-DD)")
    .option("--address <addr>", "Address")
    .option("--avatar-url <url>", "Avatar URL")
    .option("--show-in-weeks-of-life", "Show in weeks-of-life view")
    .option("--relationship-type <type>", "Relationship type (Friend, Mother, etc.)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji contacts create "John Doe"\n  $ benji contacts create "Jane" --email "jane@example.com" --relationship-type Friend\n  $ echo '{"name":"Bob","phone":"+1234567890"}' | benji contacts create --stdin`)
    .action(async (name, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let body: Record<string, unknown> = {};
        if (options.stdin) {
          body = await readStdin();
        }
        if (name) body.name = name;
        if (options.email !== undefined) body.email = options.email;
        if (options.phone !== undefined) body.phone = options.phone;
        if (options.birthday !== undefined) body.birthday = options.birthday;
        if (options.address !== undefined) body.address = options.address;
        if (options.avatarUrl !== undefined) body.avatarUrl = options.avatarUrl;
        if (options.showInWeeksOfLife) body.showInWeeksOfLife = true;
        if (options.relationshipType !== undefined) body.relationshipType = options.relationshipType;

        const result = await wrapSdkCall(
          Contacts.contactsCreate({ body } as Parameters<typeof Contacts.contactsCreate>[0]),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("get")
    .description("Get a contact by ID")
    .argument("<id>", "Contact ID")
    .addHelpText("after", `\nExamples:\n  $ benji contacts get abc123\n  $ benji contacts get abc123 --json`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Contacts.contactsGet({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("update")
    .description("Update a contact")
    .argument("<id>", "Contact ID")
    .option("--name <name>", "Contact name")
    .option("--email <email>", "Email address")
    .option("--phone <phone>", "Phone number")
    .option("--birthday <date>", "Birthday (YYYY-MM-DD)")
    .option("--address <addr>", "Address")
    .option("--avatar-url <url>", "Avatar URL")
    .option("--show-in-weeks-of-life", "Show in weeks-of-life view")
    .option("--no-show-in-weeks-of-life", "Hide from weeks-of-life view")
    .option("--relationship-type <type>", "Relationship type")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText("after", `\nExamples:\n  $ benji contacts update abc123 --name "Updated Name"\n  $ benji contacts update abc123 --email "new@example.com"\n  $ benji contacts update abc123 --no-show-in-weeks-of-life\n  $ echo '{"name":"New Name"}' | benji contacts update abc123 --stdin`)
    .action(async (id, options, command) => {
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        let data: Record<string, unknown> = {};
        if (options.stdin) {
          data = await readStdin();
        }
        if (options.name !== undefined) data.name = options.name;
        if (options.email !== undefined) data.email = options.email;
        if (options.phone !== undefined) data.phone = options.phone;
        if (options.birthday !== undefined) data.birthday = options.birthday;
        if (options.address !== undefined) data.address = options.address;
        if (options.avatarUrl !== undefined) data.avatarUrl = options.avatarUrl;
        if (options.showInWeeksOfLife !== undefined) data.showInWeeksOfLife = options.showInWeeksOfLife;
        if (options.relationshipType !== undefined) data.relationshipType = options.relationshipType;

        const result = await wrapSdkCall(
          Contacts.contactsUpdate({ body: { id, data } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });

  cmd
    .command("delete")
    .description("Delete a contact")
    .argument("<id>", "Contact ID")
    .option("--force", "Confirm deletion")
    .addHelpText("after", `\nExamples:\n  $ benji contacts delete abc123 --force\n  $ benji contacts delete abc123 --force --json`)
    .action(async (id, options, command) => {
      requireForce(command, "contacts", "delete");
      ensureAuth();
      const opts = getGlobalOptions(command);
      try {
        const result = await wrapSdkCall(
          Contacts.contactsDelete({ body: { id } }),
        );
        outputResult(result, opts);
      } catch (error) {
        handleCommandError(error);
      }
    });
}
