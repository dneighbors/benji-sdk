import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Contacts, wrapSdkCall } from "benji-sdk";
import { toolResult, handleToolError, tzDateSchema } from "./util.js";

const relationshipTypeEnum = z.enum([
  "Girlfriend",
  "Boyfriend",
  "Friend",
  "Husband",
  "Wife",
  "Grandfather",
  "Grandmother",
  "Grandchild",
  "Mother",
  "Father",
  "Son",
  "Daughter",
  "BrotherInLaw",
  "SisterInLaw",
  "FatherInLaw",
  "MotherInLaw",
  "Sister",
  "Brother",
  "Cousin",
  "Aunt",
  "Uncle",
  "Nephew",
  "Niece",
  "Acquaintance",
  "Other",
]);

/**
 * Register all 5 contact MCP tools on the given server.
 */
export function registerContactTools(server: McpServer): void {
  // -- list_contacts ------------------------------------------------------------
  server.registerTool(
    "list_contacts",
    {
      description:
        "List all contact relationships for the current user, ordered by activity.",
    },
    async () => {
      try {
        const result = await wrapSdkCall(Contacts.contactsList());
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- create_contact -----------------------------------------------------------
  server.registerTool(
    "create_contact",
    {
      description:
        "Create a new contact relationship. Requires a name. Optionally include email, phone, birthday, address, avatar URL, relationship type, etc.",
      inputSchema: {
        contactId: z
          .string()
          .min(1)
          .optional()
          .describe("Existing contact ID to link to (for updating an existing contact)"),
        name: z.string().min(1).describe("Contact name"),
        email: z
          .string()
          .nullable()
          .optional()
          .describe("Contact email address"),
        phone: z
          .string()
          .nullable()
          .optional()
          .describe("Contact phone number"),
        birthday: tzDateSchema
          .nullable()
          .optional()
          .describe("Contact birthday (timezone and dateInUsersTimezone)"),
        address: z
          .string()
          .nullable()
          .optional()
          .describe("Contact address"),
        avatarUrl: z
          .string()
          .nullable()
          .optional()
          .describe("URL for the contact's avatar image"),
        showInWeeksOfLife: z
          .boolean()
          .optional()
          .describe("Whether to show this contact in weeks-of-life view"),
        relationshipType: relationshipTypeEnum
          .optional()
          .describe(
            "Relationship type (e.g. Friend, Mother, Brother, Acquaintance, etc.)",
          ),
      },
    },
    async ({
      contactId,
      name,
      email,
      phone,
      birthday,
      address,
      avatarUrl,
      showInWeeksOfLife,
      relationshipType,
    }) => {
      try {
        const result = await wrapSdkCall(
          Contacts.contactsCreate({
            body: {
              contactId,
              name,
              email,
              phone,
              birthday,
              address,
              avatarUrl,
              showInWeeksOfLife,
              relationshipType,
            },
          }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- get_contact --------------------------------------------------------------
  server.registerTool(
    "get_contact",
    {
      description: "Get a single contact relationship by ID.",
      inputSchema: {
        id: z.string().min(1).describe("The contact relationship ID"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Contacts.contactsGet({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- update_contact -----------------------------------------------------------
  server.registerTool(
    "update_contact",
    {
      description:
        "Update a contact relationship. Provide the contact ID and the fields to update.",
      inputSchema: {
        id: z.string().min(1).describe("The contact relationship ID to update"),
        data: z
          .object({
            contactId: z
              .string()
              .min(1)
              .optional()
              .describe("Updated linked contact ID"),
            name: z
              .string()
              .min(1)
              .optional()
              .describe("Updated contact name"),
            email: z
              .string()
              .nullable()
              .optional()
              .describe("Updated email"),
            phone: z
              .string()
              .nullable()
              .optional()
              .describe("Updated phone number"),
            birthday: tzDateSchema
              .nullable()
              .optional()
              .describe("Updated birthday"),
            address: z
              .string()
              .nullable()
              .optional()
              .describe("Updated address"),
            avatarUrl: z
              .string()
              .nullable()
              .optional()
              .describe("Updated avatar URL"),
            showInWeeksOfLife: z
              .boolean()
              .optional()
              .describe("Updated weeks-of-life visibility"),
            relationshipType: relationshipTypeEnum
              .optional()
              .describe("Updated relationship type"),
          })
          .refine(
            (d) =>
              d.contactId !== undefined ||
              d.name !== undefined ||
              d.email !== undefined ||
              d.phone !== undefined ||
              d.birthday !== undefined ||
              d.address !== undefined ||
              d.avatarUrl !== undefined ||
              d.showInWeeksOfLife !== undefined ||
              d.relationshipType !== undefined,
            {
              message:
                "At least one field must be provided to update",
            },
          )
          .describe("Fields to update"),
      },
    },
    async ({ id, data }) => {
      try {
        const result = await wrapSdkCall(
          Contacts.contactsUpdate({ body: { id, data } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );

  // -- delete_contact -----------------------------------------------------------
  server.registerTool(
    "delete_contact",
    {
      description: "Delete a contact relationship by ID.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("The contact relationship ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const result = await wrapSdkCall(
          Contacts.contactsDelete({ body: { id } }),
        );
        return toolResult(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
