import { Command } from "commander";

/** Walk the command chain to the root program and extract global options. */
export function getGlobalOptions(cmd: Command): { json: boolean } {
  let root = cmd;
  while (root.parent) {
    root = root.parent;
  }
  return { json: root.opts().json === true };
}

/** Print result to stdout. Table formatting deferred to Story 6.3. */
export function outputResult(
  data: unknown,
  opts: { json: boolean }
): void {
  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
