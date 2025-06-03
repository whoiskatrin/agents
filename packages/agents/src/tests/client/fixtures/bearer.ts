import { McpAgent } from "../../../mcp/index.ts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export type Env = {
  MCP_OBJECT: DurableObjectNamespace<McpAgent>;
};

type State = unknown;

type Props = {
  testValue: string;
};

export class TestMcpAgent extends McpAgent<Env, State, Props> {
  server = new McpServer(
    { name: "test-server", version: "1.0.0" },
    { capabilities: { logging: {} } }
  );

  async init() {
    this.server.tool(
      "greet",
      "A simple greeting tool",
      { name: z.string().describe("Name to greet") },
      async ({ name }): Promise<CallToolResult> => {
        return { content: [{ type: "text", text: `Hello, ${name}!` }] };
      }
    );

    this.server.tool(
      "getPropsTestValue",
      {},
      async (): Promise<CallToolResult> => {
        return {
          content: [{ type: "text", text: this.props.testValue }],
        };
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (request.headers.get("Authorization") !== "Bearer foo-bar") {
      return new Response("Unauthorized", { status: 401 });
    }

    // set some props that should be passed init
    ctx.props = {
      testValue: "123",
    };

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return TestMcpAgent.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return TestMcpAgent.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
