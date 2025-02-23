## Human in the Loop with Cloudflare Agents

This example demonstrates how to implement human-in-the-loop functionality using Cloudflare Agents, allowing AI agents to request human approval before executing certain actions. This pattern is crucial for scenarios where human oversight and confirmation are required before taking important actions.

### Overview

The implementation showcases:

- AI agents that can request human approval for specific actions
- Real-time communication between agents and humans using WebSocket connections
- Persistent state management across agent lifecycles
- Tool-based architecture for extensible agent capabilities
- Modern UI with dark mode support and accessibility features

### Key Components

1. **Agent Definition**

```ts
export class HumanInTheLoop extends AIChatAgent<Env> {
  async onChatMessage(
    connection: Connection,
    messages: Message[],
    onFinish: StreamTextOnFinishCallback<any>
  ) {
    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Process messages and check for tool calls requiring confirmation
        const processedMessages = await processToolCalls({
          messages,
          dataStream,
          tools: {
            getWeatherInformation: {
              requiresApproval: true,
              execute: async ({ city }) => {
                // Example tool implementation
                return `The weather in ${city} is sunny.`;
              },
            },
          },
        });

        // Stream response using the processed messages
        streamText({
          model: openai("gpt-4o"),
          messages: processedMessages,
          tools,
          onFinish,
        }).mergeIntoDataStream(dataStream);
      },
    });
  }
}
```

2. **React Client Integration**

```tsx
function Chat() {
  // Initialize agent and chat hooks
  const agent = useAgent({ agent: "human-in-the-loop" });
  const { messages, addToolResult } = useAgentChat({ agent });

  return (
    <div className="chat-container">
      {messages.map((message) => (
        <div key={message.id}>
          {/* Render normal messages */}
          {message.type === "text" && (
            <div className="message">{message.content}</div>
          )}

          {/* Render tool approval requests */}
          {message.type === "tool-invocation" && (
            <div className="tool-approval">
              <p>
                Approve {message.tool} for {message.args.city}?
              </p>
              <button onClick={() => addToolResult(message.id, "approve")}>
                Yes
              </button>
              <button onClick={() => addToolResult(message.id, "reject")}>
                No
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Features

- **Persistent State**: Agent state persists across sessions using Cloudflare's durable storage
- **Real-time Updates**: WebSocket connections ensure immediate updates for approval requests
- **Tool Registry**: Flexible tool system with configurable approval requirements
- **Type Safety**: Full TypeScript support for tool definitions and parameters
- **Modern UI**:
  - Dark/Light mode with smooth transitions
  - Accessible theme toggle switch
  - Auto-scrolling chat interface
  - Custom scrollbar styling
  - Responsive design
  - Clear history functionality

### Getting Started

1. Configure your `wrangler.toml`:

```toml
[[durable_objects]]
binding = "HumanInTheLoopAgent"
class_name = "HumanInTheLoopAgent"

[env.production]
OPENAI_API_KEY = "your-api-key"
```

2. Deploy your agent:

```bash
wrangler deploy
```

3. Connect from your frontend using the React hooks provided by `@cloudflare/agents/react`

### Best Practices

- Define clear approval workflows for sensitive operations
- Implement timeouts for approval requests
- Provide detailed context in approval requests
- Handle connection drops and reconnections gracefully
- Log all approval decisions for audit trails
- Ensure proper error handling and fallbacks
- Follow accessibility guidelines for UI components

### Learn More

- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [Building AI Agents with Human Oversight](https://developers.cloudflare.com/agents/patterns/human-in-the-loop/)
- [State Management in Cloudflare Agents](https://developers.cloudflare.com/agents/state-management/)
