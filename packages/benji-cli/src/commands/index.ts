import { Command } from "commander";
import { registerTodosCommand } from "./todos.js";
import { registerStubCommand } from "./stub.js";

export function registerCommands(program: Command): void {
  registerTodosCommand(program);

  registerStubCommand(program, "tags", "Manage tags", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "projects", "Manage projects", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "todo-lists", "Manage todo lists", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "habits", "Manage habits", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "mood", "Track mood entries", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "hydration", "Track hydration", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "fasting", "Manage fasting sessions", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "workouts", "Manage workouts", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "journal", "Manage journal entries", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "pain-events", "Track pain events", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "weight-logs", "Track weight logs", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "todo-views", "Manage todo views", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "project-sections", "Manage project sections", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(
    program,
    "todo-list-sections",
    "Manage todo list sections",
    ["list", "create", "update", "delete"]
  );
  registerStubCommand(program, "goals", "Manage goals", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "contacts", "Manage contacts", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "food", "Track food entries", [
    "list",
    "create",
    "update",
    "delete",
  ]);
  registerStubCommand(program, "blood-pressure", "Track blood pressure", [
    "list",
    "create",
    "update",
    "delete",
  ]);
}
