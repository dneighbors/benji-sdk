#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeFromEnv, BenjiConfigError } from "benji-sdk";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  try {
    initializeFromEnv();
  } catch (error: unknown) {
    if (error instanceof BenjiConfigError) {
      console.error(error.message);
      process.exit(1);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to initialize from environment:", message);
    process.exit(1);
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("benji-mcp server started");
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
