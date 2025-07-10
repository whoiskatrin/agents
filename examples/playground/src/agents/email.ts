import { getAgentByName } from "agents";
import { AIChatAgent } from "agents/ai-chat-agent";
import { convertToCoreMessages, streamText } from "ai";

import { createMimeMessage } from "mimetext";
// import PostalMime from "postal-mime";
import * as MockEmail from "../mock-cloudflare-email";
import { model } from "../model";
import type { Env } from "../server";
export async function sendEmail(
  id: DurableObjectId,
  EMAIL: SendEmail,
  from: string,
  fromName: string,
  fromDomain: string,
  recipient: string,
  subject: string,
  contentType: string,
  body: string
) {
  if (!EMAIL) {
    throw new Error("Email is not configured");
  }

  const msg = createMimeMessage();
  msg.setSender({ addr: from, name: fromName });
  msg.setRecipient(recipient);
  msg.setSubject(subject);
  msg.addMessage({
    contentType: contentType,
    data: body,
  });
  msg.setHeader("Message-ID", `<${idToBase64(id)}@${fromDomain}>`);

  // import this dynamically import { EmailMessage } from 'cloudflare:email'
  const { EmailMessage } = await import("cloudflare:email");
  console.log(`sending email from ${from} to ${recipient}`);
  await EMAIL.send(new EmailMessage(from, recipient, msg.asRaw()));

  return "Email sent successfully!";
}

export function idToBase64(id: DurableObjectId) {
  return Buffer.from(id.toString(), "hex").toString("base64");
}

export function base64IDtoString(base64id: string) {
  return Buffer.from(base64id, "base64").toString("hex");
}

async function createMockEmail(options: {
  id: string;
  from: string;
  name: string;
  to: string;
  subject: string;
  body: string;
  contentType: string;
}) {
  const email = createMimeMessage();
  email.setSender({ addr: options.from, name: options.name });
  email.setRecipient(options.to);
  email.setSubject(options.subject);
  email.addMessage({
    contentType: options.contentType,
    data: options.body,
  });
  email.setHeader("Message-ID", `<${options.id}@${options.from}>`);
  const mockEmailMessage = new MockEmail.MockEmailMessage(
    options.from,
    options.to,
    email.asRaw()
  );
  return mockEmailMessage;
}
export class EmailAgent extends AIChatAgent<Env> {
  async onRequest(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/api/email") && request.method === "POST") {
      // this is dev mode, or we would have receievd it directly in onEmail
      // so let's redirect it there
      const body = await request.json<{
        from: string;
        to: string;
        message: string;
      }>();
      console.log("received email", body);
      const mockEmail = new MockEmail.MockForwardableEmailMessage(
        body.from,
        body.to,
        body.message
      );
      this.onEmail(mockEmail);
      return new Response("OK", { status: 200 });
    }

    return super.onRequest(request);
  }

  async onEmail(_email: ForwardableEmailMessage) {
    //
  }

  async onChatMessage() {
    const result = await streamText({
      messages: convertToCoreMessages(this.messages),
      model,
      onStepFinish: async (step) => {
        // if ([...this.getConnections()].length === 0) {

        // biome-ignore lint/correctness/noConstantCondition: work in progress
        if (true) {
          // send an email instead
          try {
            console.log("sending email", step.text);
            // we would replace this with a send_email call
            const mockEmail = await getAgentByName(
              this.env.MockEmailService,
              "default"
            );
            const emailToSend = await createMockEmail({
              body: step.text,
              contentType: "text/plain",
              from: "emailAgent@example.com",
              id: this.ctx.id.toString(),
              name: "emailAgent",
              subject: "Email from emailAgent",
              to: "theman@example.com",
            });
            mockEmail
              .toInbox({
                from: emailToSend.from,
                message: emailToSend.message,
                to: emailToSend.to,
              })
              .catch((e) => {
                console.error("error sending email", e);
              });
          } catch (e) {
            console.error("error sending email", e);
          }
        }
      },
    });

    return result.toTextStreamResponse();
  }
}

// export const emailHandler: EmailExportedHandler<Env> =
//   async function emailHandler(
//     email: ForwardableEmailMessage,
//     env: Env,
//     ctx: ExecutionContext
//   ) {
//     // @ts-ignore
//     console.log(Object.fromEntries(email.headers.entries()));
//     const parsed = await PostalMime.parse(email.raw);
//     console.log(parsed);

//     const routingMatch = email.headers
//       .get("references")
//       ?.match(/<([A-Za-z0-9+\/]{43}=)@gmad.dev/);
//     console.log({
//       references: email.headers.get("references"),
//       do_match: routingMatch,
//     });

//     if (routingMatch) {
//       const [_, base64id] = routingMatch;

//       try {
//         const ns = env.Email;
//         const stub = ns.get(ns.idFromString(base64IDtoString(base64id)));
//         await stub.receiveEmail(
//           email.from,
//           email.to,
//           email.headers.get("subject")!,
//           parsed.text!
//         );
//       } catch (e) {
//         console.error(e);
//       }
//     }
//   };
