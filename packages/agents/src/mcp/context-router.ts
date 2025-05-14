import { jsonSchema, type CoreMessage, type ToolSet, type LanguageModelV1, type UserContent } from "ai";
import  { getNamespacedData, type MCPClientManager, type NamespacedData } from "./client";
import type { MCPClientConnection } from "./client-connection";
import type { Resource } from "@modelcontextprotocol/sdk/types.js"

/**
 * A context router provides an interface for:
 * - Filtering tools and resources
 * - Exposes a system prompt based on the MCP state
 */
export interface ContextRouter {
  systemPrompt(connManager: MCPClientManager): string
  
  listTools(connManager: MCPClientManager): NamespacedData["tools"]
  getAITools(connManager: MCPClientManager): ToolSet
  listResources(connManager: MCPClientManager): NamespacedData["resources"]
}

/**
 * The base ContextRouter:
 * - Does not filter tools or resources
 * - Provides a system prompt
 */
export class BaseContextRouter implements ContextRouter {
  constructor(public includeResources = true) {}

  listTools(connManager: MCPClientManager) {
    return getNamespacedData(connManager.mcpConnections, "tools");
  }

  getAITools(connManager: MCPClientManager): ToolSet {
    return Object.fromEntries(
      this.listTools(connManager).map((tool) => {
        return [
          `${tool.serverId}_${tool.name}`,
          {
            parameters: jsonSchema(tool.inputSchema),
            description: tool.description,
            execute: async (args) => {
              const result = await connManager.callTool({
                name: tool.name,
                arguments: args,
                serverId: tool.serverId,
              });
              if (result.isError) {
                // @ts-expect-error TODO we should fix this
                throw new Error(result.content[0].text);
              }
              return result;
            },
          },
        ];
      })
    )
  }

  listResources(connManager: MCPClientManager) {
    return getNamespacedData(connManager.mcpConnections, "resources");
  }

  systemPrompt(connManager: MCPClientManager): string {
    return `<integrations_list>
  You have access to multiple integrations via Model Context Protocol (MCP). These integrations provide you with tools which you can use to execute to complete tasks or retrieive information.

  ${this.includeResources && "Each integration, provides a list of resources, which are included in the list of integrations below."}

  Here is a list of all of the integrations you have access to, with instructions if necessary:
  
  ${Object.entries(connManager.mcpConnections).map(([_id, conn]) => BaseContextRouter.serverContext(conn, this.includeResources))}
<integrations_list>`
  }

  static serverContext(conn: MCPClientConnection, includeResources: boolean) {
    return `<integration>
  ${conn.serverInfo && `<integration_name>${conn.serverInfo.name}</integration_name>`}
  ${conn.instructions && `<integration_instructions>${conn.instructions}</integration_instructions>`}
  ${includeResources && `<resources_list>${conn.resources.map((resource) => BaseContextRouter.resourceContext(resource))}</resources_list>`}
<integration>`;
  }
  
  static resourceContext(resource: Resource) {
    return `<resource>
  <name>${resource.name}</name>
  <uri>${resource.uri}</uri>
  <description>${resource.description}</description>
  <mimeType>${resource.mimeType}</mimeType>
</resource>`;
  }
}