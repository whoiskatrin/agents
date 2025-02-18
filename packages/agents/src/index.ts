import {
  Server,
  routePartykitRequest,
  PartyServerOptions,
  getServerByName,
} from "partyserver";

export { Connection, WSMessage } from "partyserver";

export { WorkflowEntrypoint } from "cloudflare:workers";

export class Agent<Env> extends Server<Env> {
  static options = {
    hibernate: true, // default to hibernate
  };
  sql() {
    throw new Error("Not implemented");
  }
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.sql;
  }
  onEmail(email: ForwardableEmailMessage) {
    throw new Error("Not implemented");
  }
  render() {
    throw new Error("Not implemented");
  }
}

export type AgentNamespace<Agentic extends Agent<unknown>> =
  DurableObjectNamespace<Agentic>;

export function routeAgentRequest<Env extends Record<string, unknown>>(
  request: Request,
  env: Env,
  options?: PartyServerOptions<Env>
) {
  return routePartykitRequest(request, env, {
    prefix: "agents",
    ...options,
  });
}

export function routeAgentEmail<Env extends Record<string, unknown>>(
  email: ForwardableEmailMessage,
  env: Env,
  options?: PartyServerOptions<Env>
) {
  throw new Error("Not implemented");
}

export function getAgentByName<
  Env extends Record<string, unknown>,
  T extends Agent<Env>
>(
  namespace: AgentNamespace<T>,
  name: string,
  options?: {
    jurisdiction?: DurableObjectJurisdiction;
    locationHint?: DurableObjectLocationHint;
  }
) {
  return getServerByName<Env, T>(namespace, name, options);
}
