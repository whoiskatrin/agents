import { Agent } from "@cloudflare/agents";
import type { Env } from "../server";
export class Stateful extends Agent<Env> {}
