import { usePartySocket } from "partysocket/react";

type UseAgentOptions = Omit<
  Parameters<typeof usePartySocket>[0],
  "party" | "room"
> & {
  agent: string;
  name?: string;
};

export function useAgent(options: UseAgentOptions) {
  return usePartySocket({
    prefix: "agents",
    party: options.agent,
    room: options.name || "default",
    ...options,
  });
}
