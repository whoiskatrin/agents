import type { Message as ChatMessage } from "ai";

export type OutgoingMessage =
  | {
      type: "cf_agent_chat_messages";
      messages: ChatMessage[];
    }
  | {
      type: "cf_agent_use_chat_response";
      id: string;
      body: string;
      done: boolean;
    }
  | {
      type: "cf_agent_chat_messages";
      messages: ChatMessage[];
    }
  | {
      type: "cf_agent_chat_clear";
    };

export type IncomingMessage =
  | {
      type: "cf_agent_chat_init";
      messages: ChatMessage[];
    }
  | {
      type: "cf_agent_use_chat_request";
      id: string;
      init: Pick<
        RequestInit,
        | "method"
        | "keepalive"
        | "headers"
        | "body"
        | "redirect"
        | "integrity"
        | "credentials"
        | "mode"
        | "referrer"
        | "referrerPolicy"
        | "window"
      >;
    }
  | {
      type: "cf_agent_chat_clear";
    }
  | {
      type: "cf_agent_chat_messages";
      messages: ChatMessage[];
    };
