import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

/**
 * Create and return the MCP server instance.
 *
 * Declares tool capabilities so clients know this server supports tools.
 * No tools are registered at this stage — tools are added in Stories 2.2-2.7.
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

  return mcpServer;
}
