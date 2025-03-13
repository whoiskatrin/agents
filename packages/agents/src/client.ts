import {
  PartySocket,
  type PartySocketOptions,
  type PartyFetchOptions,
} from "partysocket";

/**
 * Options for creating an AgentClient
 */
export type AgentClientOptions = Omit<PartySocketOptions, "party" | "room"> & {
  /** Name of the agent to connect to */
  agent: string;
  /** Name of the specific Agent instance */
  name?: string;
};

/**
 * Options for the agentFetch function
 */
export type AgentClientFetchOptions = Omit<
  PartyFetchOptions,
  "party" | "room"
> & {
  /** Name of the agent to connect to */
  agent: string;
  /** Name of the specific Agent instance */
  name?: string;
};

/**
 * WebSocket client for connecting to an Agent
 */
export class AgentClient extends PartySocket {
  static fetch(opts: PartyFetchOptions): Promise<Response> {
    throw new Error(
      "AgentClient.fetch is not implemented, use agentFetch instead"
    );
  }
  agent: string;
  name: string;
  constructor(opts: AgentClientOptions) {
    super({
      prefix: "agents",
      party: opts.agent,
      room: opts.name || "default",
      ...opts,
    });
    this.agent = opts.agent;
    this.name = opts.name || "default";
    // warn if agent or name isn't in lowercase
    if (this.agent !== this.agent.toLowerCase()) {
      console.warn(
        `Agent name: ${this.agent} should probably be in lowercase. Received: ${this.agent}`
      );
    }
    if (this.name !== this.name.toLowerCase()) {
      console.warn(
        `Agent instance name: ${this.name} should probably be in lowercase. Received: ${this.name}`
      );
    }
  }
}

/**
 * Make an HTTP request to an Agent
 * @param opts Connection options
 * @param init Request initialization options
 * @returns Promise resolving to a Response
 */
export function agentFetch(opts: AgentClientFetchOptions, init?: RequestInit) {
  // warn if agent or name isn't in lowercase
  if (opts.agent !== opts.agent.toLowerCase()) {
    console.warn(
      `Agent name: ${opts.agent} should probably be in lowercase. Received: ${opts.agent}`
    );
  }
  if (opts.name && opts.name !== opts.name.toLowerCase()) {
    console.warn(
      `Agent instance name: ${opts.name} should probably be in lowercase. Received: ${opts.name}`
    );
  }

  return PartySocket.fetch(
    {
      prefix: "agents",
      party: opts.agent,
      room: opts.name || "default",
      ...opts,
    },
    init
  );
}
