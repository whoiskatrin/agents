import type { MCPClientConnection } from "./client-connection";
import type { Resource } from "@modelcontextprotocol/sdk/types.js";

export function unstable_getMcpPrompt(
  conns: Record<string, MCPClientConnection>,
  includeResources: boolean
) {
  return `<integrations_list>
        You have access to multiple integrations via Model Context Protocol (MCP). These integrations provide you with tools which you can use to execute to complete tasks or retrieive information.

        ${includeResources && "Each integration, provides a list of resources, which are included in the list of integrations below."}

        Here is a list of all of the integrations you have access to, with instructions if necessary:
        
        ${Object.entries(conns).map(([_id, conn]) => serverContext(conn, includeResources))}
    <integrations_list>`;
}

function serverContext(conn: MCPClientConnection, includeResources: boolean) {
  return `<integration>
        ${conn.serverInfo && `<integration_name>${conn.serverInfo.name}</integration_name>`}
        ${conn.instructions && `<integration_instructions>${conn.instructions}</integration_instructions>`}
        ${includeResources && `<resources_list>${conn.resources.map((resource) => resourceContext(resource))}</resources_list>`}
    <integration>`;
}

function resourceContext(resource: Resource) {
  return `<resource>
        <name>${resource.name}</name>
        <uri>${resource.uri}</uri>
        <description>${resource.description}</description>
        <mimeType>${resource.mimeType}</mimeType>
    </resource>`;
}
