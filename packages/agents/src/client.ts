import {
  PartySocket,
  type PartySocketOptions,
  type PartyFetchOptions,
} from "partysocket";

export type AgentClientOptions = Omit<PartySocketOptions, "prefix" | "room"> & {
  room?: string;
};

export type AgentClientFetchOptions = Omit<
  PartyFetchOptions,
  "prefix" | "room"
> & {
  room?: string;
};

export class AgentClient extends PartySocket {
  static fetch(opts: AgentClientFetchOptions) {
    return PartySocket.fetch({
      prefix: "agents",
      room: "default",
      ...opts,
    });
  }
  constructor(opts: AgentClientOptions) {
    super({
      prefix: "agents",
      room: "default",
      ...opts,
    });
  }
}
