import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import worker, { type Env } from "./worker";
import type { MCPServersState } from "../..";

declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {}
}

describe("McpClient Agent", () => {
  it("connects to unauthenticated SSE server", async () => {
    const { agent } = getAgent();
    await agent.addMcpServer(
      "unauthenticated",
      "http://localhost:8788/sse",
      "http://localhost:8787"
    );

    let mcps: MCPServersState = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(Object.values(mcps.servers)[0].state).toBe("ready");
    expect(mcps.tools).toHaveLength(2);

    // successfully reconnects
    await agent.disconnectMCPServers();
    mcps = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(Object.values(mcps.servers)[0].state).toBe("disconnected");
    expect(mcps.tools).toHaveLength(0);

    await agent.connectMCPServers();
    mcps = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(Object.values(mcps.servers)[0].state).toBe("ready");
    expect(mcps.tools).toHaveLength(2);

    await agent.disconnectMCPServers();
  });

  it("connects to bearer authenticated SSE server", async () => {
    const { agent } = getAgent();
    await agent.addMcpServer(
      "bearer",
      "http://localhost:8789/sse",
      "http://localhost:8787",
      "agents",
      {
        transport: {
          headers: {
            Authorization: "Bearer foo-bar",
          },
        },
      }
    );

    let mcps: MCPServersState = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(Object.values(mcps.servers)[0].state).toBe("ready");
    expect(mcps.tools).toHaveLength(2);

    // successfully reconnects
    await agent.disconnectMCPServers();
    mcps = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(Object.values(mcps.servers)[0].state).toBe("disconnected");
    expect(mcps.tools).toHaveLength(0);

    await agent.connectMCPServers();
    mcps = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(Object.values(mcps.servers)[0].state).toBe("ready");
    expect(mcps.tools).toHaveLength(2);

    await agent.disconnectMCPServers();
  });

  it("connects to oauth authenticated SSE server no interrupt", async () => {
    const { agent } = getAgent();
    await agent.addMcpServer(
      "oauth",
      "http://localhost:8790/sse",
      "http://localhost:8787"
    );

    let mcps: MCPServersState = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(mcps.tools).toHaveLength(0);
    const pendingAuth = Object.values(mcps.servers)[0];
    expect(pendingAuth.state).toBe("authenticating");

    // Go to server /authorize URL
    expect(pendingAuth.auth_url).toBeTruthy();
    const authorizeReq = await fetch(pendingAuth.auth_url!, {
      redirect: "manual",
    });
    expect(authorizeReq.status).toBe(302);
    const redirectUrl = authorizeReq.headers.get("Location");
    expect(redirectUrl).toBeTruthy();

    // Mock redirect callback to agent
    const res = await worker.fetch(new Request(redirectUrl!), env);
    expect(res.ok).toBeTruthy();

    // assert connection post auth
    mcps = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(Object.values(mcps.servers)[0].state).toBe("ready");
    expect(mcps.tools).toHaveLength(2);

    // successfully reconnects
    await agent.disconnectMCPServers();
    mcps = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(Object.values(mcps.servers)[0].state).toBe("disconnected");
    expect(mcps.tools).toHaveLength(0);

    await agent.connectMCPServers();
    mcps = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(Object.values(mcps.servers)[0].state).toBe("ready");
    expect(mcps.tools).toHaveLength(2);

    await agent.disconnectMCPServers();
  });

  it("connects to oauth authenticated SSE server after interruption - auth_url pre-disconnect", async () => {
    let { agent } = getAgent();
    await agent.addMcpServer(
      "oauth",
      "http://localhost:8790/sse",
      "http://localhost:8787"
    );

    const mcps: MCPServersState = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(mcps.tools).toHaveLength(0);
    const pendingAuth = Object.values(mcps.servers)[0];
    expect(pendingAuth.state).toBe("authenticating");

    await agent.disconnectMCPServers();
    await agent.connectMCPServers();

    // Go to server /authorize URL
    console.log("authing TO", pendingAuth.auth_url)
    expect(pendingAuth.auth_url).toBeTruthy();
    const authorizeReq = await fetch(pendingAuth.auth_url!, {
      redirect: "manual",
    });
    expect(authorizeReq.status).toBe(302);
    const redirectUrl = authorizeReq.headers.get("Location");
    expect(redirectUrl).toBeTruthy();

    // Mock redirect callback to agent
    const res = await worker.fetch(new Request(redirectUrl!), env);
    expect(res.ok).toBeTruthy();
    expect(res.status).toBe(200);
    const mcpsPostAuth: MCPServersState = await agent.getMcpServers();

    // assert connection
    expect(Object.entries(mcpsPostAuth.servers)).toHaveLength(1);
    expect(Object.values(mcpsPostAuth.servers)[0].state).toBe("ready");
    expect(mcpsPostAuth.tools).toHaveLength(2);

    await agent.disconnectMCPServers();
  });

  it("connects to oauth authenticated SSE server after interruption - auth_url post-disconnect", async () => {
    let { agent } = getAgent();
    await agent.addMcpServer(
      "oauth",
      "http://localhost:8790/sse",
      "http://localhost:8787"
    );

    const mcps: MCPServersState = await agent.getMcpServers();
    expect(Object.entries(mcps.servers)).toHaveLength(1);
    expect(mcps.tools).toHaveLength(0);
    const pendingAuth = Object.values(mcps.servers)[0];
    expect(pendingAuth.state).toBe("authenticating");

    await agent.disconnectMCPServers();
    await agent.connectMCPServers();

    const mcpsPostDisconnect: MCPServersState = await agent.getMcpServers();
    expect(Object.entries(mcpsPostDisconnect.servers)).toHaveLength(1);
    expect(mcpsPostDisconnect.tools).toHaveLength(0);
    const pendingAuthPostDisconnect = Object.values(mcpsPostDisconnect.servers)[0];
    expect(pendingAuthPostDisconnect.state).toBe("authenticating");

    // Go to server /authorize URL
    console.log("authing TO", pendingAuthPostDisconnect.auth_url)
    expect(pendingAuthPostDisconnect.auth_url).toBeTruthy();
    const authorizeReq = await fetch(pendingAuthPostDisconnect.auth_url!, {
      redirect: "manual",
    });
    expect(authorizeReq.status).toBe(302);
    const redirectUrl = authorizeReq.headers.get("Location");
    expect(redirectUrl).toBeTruthy();

    // Mock redirect callback to agent
    const res = await worker.fetch(new Request(redirectUrl!), env);
    expect(res.ok).toBeTruthy();
    expect(res.status).toBe(200);
    const mcpsPostAuth: MCPServersState = await agent.getMcpServers();

    // assert connection
    expect(Object.entries(mcpsPostAuth.servers)).toHaveLength(1);
    expect(Object.values(mcpsPostAuth.servers)[0].state).toBe("ready");
    expect(mcpsPostAuth.tools).toHaveLength(2);

    await agent.disconnectMCPServers();
  });
});

function getAgent(existingUuid?: string) {
  const uuid = existingUuid ?? crypto.randomUUID();
  const id = env.McpClient.idFromName(uuid);
  const stub = env.McpClient.get(id);
  stub.setName(uuid);
  return { agent: stub, uuid };
}
