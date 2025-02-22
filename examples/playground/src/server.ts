import { routeAgentEmail, routeAgentRequest } from "@cloudflare/agents";

import { Scheduler } from "./agents/scheduler";
import { Stateful } from "./agents/stateful";

export type Env = {
  Scheduler: DurableObjectNamespace<Scheduler>;
  Stateful: DurableObjectNamespace<Stateful>;
  OPENAI_API_KEY: string;
};

export { Scheduler, Stateful };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
  async email(email: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    await routeAgentEmail(email, env);
  },
} satisfies ExportedHandler<Env>;
