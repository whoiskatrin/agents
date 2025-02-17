import { usePartySocket } from "partysocket/react";

export function useAgent(options: Parameters<typeof usePartySocket>[0]) {
  return usePartySocket({
    prefix: "agents",
    ...options,
  });
}
