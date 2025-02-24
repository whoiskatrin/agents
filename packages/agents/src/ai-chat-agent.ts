import { Agent, type Connection, type WSMessage } from "./";
import type { Message as ChatMessage, StreamTextOnFinishCallback } from "ai";
import { appendResponseMessages } from "ai";
import type { OutgoingMessage, IncomingMessage } from "./ai-types";
const decoder = new TextDecoder();

export class AIChatAgent<Env = unknown> extends Agent<Env> {
  messages: ChatMessage[];
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql`create table if not exists cf_ai_chat_agent_messages (
      id text primary key,
      message text not null,
      created_at datetime default current_timestamp
    )`;
    this.messages = (
      this.sql`select * from cf_ai_chat_agent_messages` || []
    ).map((row) => {
      return JSON.parse(row.message);
    });
  }

  private sendChatMessage(connection: Connection, message: OutgoingMessage) {
    connection.send(JSON.stringify(message));
  }

  private broadcastChatMessage(message: OutgoingMessage, exclude?: string[]) {
    this.broadcast(JSON.stringify(message), exclude);
  }

  override async onMessage(connection: Connection, message: WSMessage) {
    if (typeof message === "string") {
      const data = JSON.parse(message) as IncomingMessage;
      if (data.type == "cf_agent_chat_init") {
        connection.setState({
          ...connection.state,
          isChatConnection: true,
        });
      } else if (
        data.type === "cf_agent_use_chat_request" &&
        data.init.method === "POST"
      ) {
        const {
          method,
          keepalive,
          headers,
          body, // we're reading this
          redirect,
          integrity,
          credentials,
          mode,
          referrer,
          referrerPolicy,
          window,
          // dispatcher,
          // duplex
        } = data.init;
        const { messages } = JSON.parse(body as string);
        this.broadcastChatMessage(
          {
            type: "cf_agent_chat_messages",
            messages,
          },
          [connection.id]
        );
        const message: ChatMessage = messages[messages.length - 1]; // TODO: we'll only send the last message, but we use this anyway
        // upsert if it already exists
        this
          .sql`insert or replace into cf_ai_chat_agent_messages (id, message) values (${
          message.id
        },${JSON.stringify(message)})`;
        const response = await this.onChatMessage(
          connection,
          this.sql`select * from cf_ai_chat_agent_messages`.map((row) => {
            return JSON.parse(row.message);
          }),
          ({ response }) => {
            // replace the whole db with the new messages?

            const finalMessages = appendResponseMessages({
              messages,
              responseMessages: response.messages,
            });

            this.saveMessages(finalMessages, [connection.id]);
          }
        );
        if (response) {
          this.reply(data.id, response);
        }
      } else if (data.type === "cf_agent_chat_clear") {
        this.sql`delete from cf_ai_chat_agent_messages`;
        this.broadcastChatMessage(
          {
            type: "cf_agent_chat_clear",
          },
          [connection.id]
        );
      } else if (data.type === "cf_agent_chat_messages") {
        // replace the messages with the new ones
        this.sql`delete from cf_ai_chat_agent_messages`;
        (data.messages as ChatMessage[]).forEach((message) => {
          this
            .sql`insert into cf_ai_chat_agent_messages (id, message) values (${
            message.id
          },${JSON.stringify(message)})`;
        });
        this.broadcastChatMessage(
          {
            type: "cf_agent_chat_messages",
            messages: data.messages,
          },
          [connection.id]
        );
      }
    }
  }

  override async onRequest(request: Request): Promise<Response> {
    if (request.url.endsWith("/get-messages")) {
      const messages = (
        this.sql`select * from cf_ai_chat_agent_messages` || []
      ).map((row) => {
        return JSON.parse(row.message);
      });
      return new Response(JSON.stringify(messages));
    }
    return super.onRequest(request);
  }

  async onChatMessage(
    connection: Connection,
    messages: ChatMessage[],
    onFinish: StreamTextOnFinishCallback<any>
  ): Promise<Response | undefined> {
    throw new Error(
      "recieved a chat message, override onChatMessage and return a Response to send to the client"
    );
    // override this to handle incoming messages
  }

  saveMessages(messages: ChatMessage[], excludeBroadcastIds: string[] = []) {
    this.sql`delete from cf_ai_chat_agent_messages`;
    messages.forEach((message) => {
      this.sql`insert into cf_ai_chat_agent_messages (id, message) values (${
        message.id
      },${JSON.stringify(message)})`;
    });
    this.broadcastChatMessage(
      {
        type: "cf_agent_chat_messages",
        messages: messages,
      },
      excludeBroadcastIds
    );
  }

  private async reply(id: string, response: Response) {
    const chatConnections = [...this.getConnections()].filter(
      (conn: Connection<{ isChatConnection?: boolean }>) =>
        conn.state?.isChatConnection
    );
    // now take chunks out from dataStreamResponse and send them to the client

    // @ts-ignore TODO: fix this type error
    for await (const chunk of response.body!) {
      const body = decoder.decode(chunk);

      chatConnections.forEach((conn) => {
        this.sendChatMessage(conn, {
          id,
          type: "cf_agent_use_chat_response",
          body,
          done: false,
        });
      });
    }

    chatConnections.forEach((conn) => {
      this.sendChatMessage(conn, {
        id,
        type: "cf_agent_use_chat_response",
        body: "",
        done: true,
      });
    });
  }
}
