import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import { useAgent } from "./react";
import { useEffect, use } from "react";
type UseAgentChatOptions = Omit<
  Parameters<typeof useChat>[0] & {
    agent: ReturnType<typeof useAgent>;
  },
  "fetch"
>;

// TODO: clear cache when the agent is unmounted?
const requestCache = new Map<string, Promise<any>>();

export function useAgentChat(options: UseAgentChatOptions) {
  const { agent, ...rest } = options;
  const url =
    agent._pkurl.replace("ws://", "http://").replace("wss://", "https://") +
    "/get-messages";

  const initialMessages = use(
    (() => {
      if (requestCache.has(url)) {
        return requestCache.get(url)!;
      }
      const promise = fetch(new Request(url)).then((res) => res.json());
      requestCache.set(url, promise);
      return promise;
    })()
  );

  async function aiFetch(
    request: RequestInfo | URL,
    options: RequestInit = {}
  ) {
    // we're going to use a websocket to do the actual "fetching"
    // but still satisfy the type signature of the fetch function
    // so we'll return a promise that resolves to a response

    const {
      method,
      keepalive,
      headers,
      body,
      redirect,
      integrity,
      signal,
      credentials,
      mode,
      referrer,
      referrerPolicy,
      window,
      //  dispatcher, duplex
    } = options;
    const id = crypto.randomUUID();
    const abortController = new AbortController();

    signal?.addEventListener("abort", () => {
      abortController.abort();
    });

    agent.addEventListener(
      "message",
      (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "cf_agent_use_chat_response" && data.id === id) {
          controller.enqueue(new TextEncoder().encode(data.body));
          if (data.done) {
            controller.close();
            abortController.abort();
          }
        }
      },
      { signal: abortController.signal }
    );

    let controller: ReadableStreamDefaultController;

    const stream = new ReadableStream({
      start(c) {
        controller = c;
      },
    });

    agent.send(
      JSON.stringify({
        type: "cf_agent_use_chat_request",
        id,
        url: request.toString(),
        init: {
          method,
          keepalive,
          headers,
          body,
          redirect,
          integrity,
          credentials,
          mode,
          referrer,
          referrerPolicy,
          window,
          // dispatcher,
          // duplex
        },
      })
    );

    return new Response(stream);
  }
  const useChatHelpers = useChat({
    initialMessages,
    sendExtraMessageFields: true,
    fetch: aiFetch,
    ...rest,
  });

  useEffect(() => {
    agent.send(
      JSON.stringify({
        type: "cf_agent_chat_init",
      })
    );

    function onClearHistory(event: MessageEvent) {
      const data = JSON.parse(event.data);
      if (data.type === "cf_agent_chat_clear") {
        useChatHelpers.setMessages([]);
      }
    }

    function onMessages(event: MessageEvent) {
      const data = JSON.parse(event.data);
      if (data.type === "cf_agent_chat_messages") {
        useChatHelpers.setMessages(data.messages);
      }
    }

    agent.addEventListener("message", onClearHistory);
    agent.addEventListener("message", onMessages);

    return () => {
      agent.removeEventListener("message", onClearHistory);
      agent.removeEventListener("message", onMessages);
    };
  }, []);

  return {
    ...useChatHelpers,
    setMessages: (messages: Message[]) => {
      useChatHelpers.setMessages(messages);
      agent.send(
        JSON.stringify({
          type: "cf_agent_chat_messages",
          messages,
        })
      );
    },
    clearHistory: () => {
      useChatHelpers.setMessages([]);
      agent.send(
        JSON.stringify({
          type: "cf_agent_chat_clear",
        })
      );
    },
  };
}
