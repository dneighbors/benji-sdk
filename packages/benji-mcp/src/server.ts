import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTodoTools } from "./tools/todos.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

/**
 * Create and return the MCP server instance.
 *
 * Declares tool capabilities and registers all tool modules.
 */
export function createServer(): McpServer {
  const mcpServer = new McpServer(
    {
      name: "benji-mcp",
      version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  registerTodoTools(mcpServer);

  return mcpServer;
}
