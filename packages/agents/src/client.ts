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
  constructor(opts: AgentClientOptions) {
    super({
      prefix: "agents",
      party: opts.agent,
      room: opts.name || "default",
      ...opts,
    });
  }
}

// @ts-ignore I don't know typescript
AgentClient.fetch = (opts: AgentClientFetchOptions) => {
  return PartySocket.fetch({
    prefix: "agents",
    party: opts.agent,
    room: opts.name || "default",
    ...opts,
  });
};
