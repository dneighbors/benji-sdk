import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Journal, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError } from "./util.js";

/**
 * Register all 7 journal MCP tools on the given server.
 *
 * NOTE: Encryption-related operations (encrypt, decrypt, toggleEncryption,
 * encryptMany, updateManyEncryption, getForDecrypting) are deliberately
 * NOT exposed. The encryptionKey parameter is omitted from all tool schemas.
 */
export function registerJournalTools(server: McpServer): void {
  // -- list_journal_entries -----------------------------------------------------
  server.registerTool(
    "list_journal_entries",
    {
      description:
        "List journal entries. Optionally filter by date range using dateFrom and dateTo (ISO date strings, e.g. 2026-03-01).",
      inputSchema: {
        dateFrom: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
          .optional()
          .describe(
            "Start of date range (ISO date string, e.g. 2026-03-01)",
          ),
        dateTo: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
          .optional()
          .describe("End of date range (ISO date string, e.g. 2026-03-31)"),
      },
    },
    async ({ dateFrom, dateTo }) => {
      try {
        const result = await wrapSdkCall(
          Journal.journalEntriesList({ body: { dateFrom, dateTo } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- create_journal_entry -----------------------------------------------------
  server.registerTool(
    "create_journal_entry",
    {
      description:
        "Create a new journal entry. Content is required. Optionally specify a title and date.",
      inputSchema: {
        content: z
          .string()
          .min(1)
          .describe("The journal entry content/body text"),
        title: z
          .string()
          .nullable()
          .optional()
          .describe("Title for the journal entry"),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date format YYYY-MM-DD")
          .nullable()
          .optional()
          .describe(
            "Date for the entry (ISO date string, e.g. 2026-03-28). Defaults to today if omitted.",
          ),
      },
    },
    async ({ content, title, date }) => {
      try {
        const result = await wrapSdkCall(
          Journal.journalEntriesCreate({ body: { content, title, date } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_journal_entry --------------------------------------------------------
  server.registerTool(
    "get_journal_entry",
    {
      description: "Get a single journal entry by ID.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The journal entry ID to retrieve"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Journal.journalEntriesGet({ path: { id }, body: {} }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_journal_entry -----------------------------------------------------
  server.registerTool(
    "update_journal_entry",
    {
      description:
        "Update an existing journal entry. Provide the entry ID and the fields to update.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The journal entry ID to update"),
        data: z
          .object({
            title: z
              .string()
              .nullable()
              .optional()
              .describe("Title for the journal entry"),
            content: z
              .string()
              .min(1)
              .optional()
              .describe("The journal entry content/body text"),
            date: z
              .string()
              .regex(
                /^\d{4}-\d{2}-\d{2}$/,
                "Must be ISO date format YYYY-MM-DD",
              )
              .nullable()
              .optional()
              .describe(
                "Date for the entry (ISO date string, e.g. 2026-03-28)",
              ),
          })
          .refine(
            (d) =>
              d.title !== undefined ||
              d.content !== undefined ||
              d.date !== undefined,
            {
              message:
                "At least one field (title, content, or date) must be provided",
            },
          )
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Journal.journalEntriesUpdate({ path: { id }, body: { data } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_journal_entry -----------------------------------------------------
  server.registerTool(
    "delete_journal_entry",
    {
      description: "Delete a journal entry by ID.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The journal entry ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Journal.journalEntriesDelete({ path: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_many_journal_entries -----------------------------------------------
  server.registerTool(
    "delete_many_journal_entries",
    {
      description: "Delete multiple journal entries by their IDs.",
      inputSchema: {
        ids: z
          .array(z.string().min(1))
          .min(1)
          .describe("Array of journal entry IDs to delete"),
      },
    },
    async ({ ids }) => {
      try {
        const result = await wrapSdkCall(
          Journal.journalEntriesDeleteMany({ body: { ids } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_journal_stats --------------------------------------------------------
  server.registerTool(
    "get_journal_stats",
    {
      description:
        "Get journal statistics including total entries, total words, and current streak.",
    },
    async () => {
      try {
        const result = await wrapSdkCall(
          Journal.journalEntriesStats({ body: {} }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
