import {
  PartySocket,
  PartySocketOptions,
  PartyFetchOptions,
} from "partysocket";

export class AgentClient extends PartySocket {
  static fetch(opts: PartyFetchOptions) {
    return PartySocket.fetch({
      prefix: "agents",
      ...opts,
    });
  }
  constructor(opts: PartySocketOptions) {
    super({
      prefix: "agents",
      ...opts,
    });
  }
}
