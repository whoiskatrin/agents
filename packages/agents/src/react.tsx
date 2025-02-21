import type { PartySocket } from "partysocket";
import { usePartySocket } from "partysocket/react";

export type UseAgentOptions<State = unknown> = Omit<
  Parameters<typeof usePartySocket>[0],
  "party" | "room"
> & {
  agent: string;
  name?: string;
  onStateUpdate?: (state: State, source: "server" | "client") => void;
};

export function useAgent<State = unknown>(
  options: UseAgentOptions<State>
): PartySocket & { setState: (state: State) => void } {
  const agent = usePartySocket({
    prefix: "agents",
    party: options.agent,
    room: options.name || "default",
    ...options,
    onMessage: (message) => {
      if (
        typeof message.data === "string" &&
        message.data.startsWith("cf_agent_state:")
      ) {
        const parsedMessage = JSON.parse(message.data.slice(15));
        options.onStateUpdate?.(parsedMessage.state, "server");
        return;
      }
      options.onMessage?.(message);
    },
  }) as PartySocket & { setState: (state: State) => void };

  agent.setState = (state: State) => {
    agent.send(
      "cf_agent_state:" + JSON.stringify({ type: "cf_agent_state", state })
    );
    options.onStateUpdate?.(state, "client");
  };

  return agent;
}
