import {
  PartySocket,
  type PartySocketOptions,
  type PartyFetchOptions,
} from "partysocket";

export type AgentClientOptions = Omit<PartySocketOptions, "party" | "room"> & {
  agent: string;
  name?: string;
};

export type AgentClientFetchOptions = Omit<
  PartyFetchOptions,
  "party" | "room"
> & {
  agent: string;
  name?: string;
};

export class AgentClient extends PartySocket {
  static fetch(opts: PartyFetchOptions): Promise<Response> {
    throw new Error(
      "AgentClient.fetch is not implemented, use agentFetch instead"
    );
  }
  constructor(opts: AgentClientOptions) {
    super({
      prefix: "agents",
      party: opts.agent,
      room: opts.name || "default",
      ...opts,
    });
  }
}

export function agentFetch(opts: AgentClientFetchOptions, init?: RequestInit) {
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
