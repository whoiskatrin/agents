# 🧠 Cloudflare Agents

![agents-header](https://github.com/user-attachments/assets/f6d99eeb-1803-4495-9c5e-3cf07a37b402)

_This project is in active development. Join us in shaping the future of intelligent agents._

Welcome to a new paradigm in AI development. Cloudflare Agents provides the foundation for building intelligent, stateful agents that persist, think, and evolve at the edge of the network.

## Vision

We're creating a framework where AI agents can:

- Maintain persistent state and memory
- Engage in real-time communication
- Process and learn from interactions
- Operate autonomously at global scale
- Hibernate when idle, awaken when needed

## Project Status

This project is actively evolving. Current focus areas:

### Ready for Use

- Core agent framework with state management
- Real-time WebSocket communication
- HTTP endpoints and routing
- React integration hooks
- Basic AI chat capabilities

### In Development

- Advanced memory systems
- WebRTC for audio/video
- Email integration
- Evaluation framework
- Enhanced observability
- Self-hosting guide

## Getting Started

### Quick Start

```bash
# Create a new project
npm create cloudflare@latest -- --template agents

# Or add to existing project
npm install @cloudflare/agents
```

## Documentation

For comprehensive documentation and guides:

- [Core Framework](packages/agents/README.md)
- [The Anthropic Patterns for building effective agents](guides/anthropic-patterns/README.md)
- [Human in the Loop](guides/human-in-the-loop/README.md)
- [Playground](examples/playground/README.md)

## Contributing

We welcome contributions! Whether it's:

- New examples
- Documentation improvements
- Bug fixes
- Feature suggestions

## License

MIT License - Build something meaningful.

---

# hono-agents

🔥 Hono ⨉ 🧠 Cloudflare Agents

Add intelligent, stateful AI agents to your Hono app. Create persistent AI agents that can think, communicate, and evolve over time, all integrated seamlessly with your Hono application.

## Installation

```bash
npm install hono-agents hono @cloudflare/agents
```

## Usage

```ts
import { Hono } from "hono";
import { agentsMiddleware } from "hono-agents";
import { Agent } from "@cloudflare/agents";

// Define your agent classes
export class ChatAgent extends Agent {
  async onRequest(request) {
    return new Response("Ready to assist with chat.");
  }
}

export class AssistantAgent extends Agent {
  async onRequest(request) {
    return new Response("I'm your AI assistant.");
  }
}

// Basic setup
const app = new Hono();
app.use("*", agentsMiddleware());

// or with authentication
app.use(
  "*",
  agentsMiddleware({
    options: {
      onBeforeConnect: async (req) => {
        const token = req.headers.get("authorization");
        // validate token
        if (!token) return new Response("Unauthorized", { status: 401 });
      },
    },
  })
);

// With error handling
app.use("*", agentsMiddleware({ onError: (error) => console.error(error) }));

// With custom routing
app.use(
  "*",
  agentsMiddleware({
    options: {
      prefix: "/agents", // Handles /agents/* routes only
    },
  })
);

export default app;
```

## React Usage

```tsx
import { useAgent } from "@cloudflare/agents/react";

// Basic connection
const agent = useAgent({ agent: "chat-agent", name: "support" });

// Assistant connection
const agent = useAgent({ agent: "assistant-agent", name: "helper" });

// With auth
const agent = useAgent({
  agent: "chat-agent",
  name: "support",
  headers: { authorization: `Bearer ${token}` },
});

// Using the agent state
function StateInterface() {
  const [state, setState] = useState({ counter: 0 });

  const agent = useAgent({
    agent: "thinking-agent",
    onStateUpdate: (newState) => setState(newState),
  });

  const increment = () => {
    agent.setState({ counter: state.counter + 1 });
  };

  return (
    <div>
      <div>Count: {state.counter}</div>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

// AI Chat Interface
function ChatInterface() {
  const agent = useAgent({
    agent: "dialogue-agent",
  });

  const { messages, input, handleInputChange, handleSubmit, clearHistory } =
    useAgentChat({
      agent,
      maxSteps: 5,
    });

  return (
    <div className="chat-interface">
      <div className="message-flow">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <div className="role">{message.role}</div>
            <div className="content">{message.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="input-area">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          className="message-input"
        />
      </form>

      <button onClick={clearHistory} className="clear-button">
        Clear Chat
      </button>
    </div>
  );
}
```

## Configuration

To properly configure your Cloudflare Workers project to use agents, update your `wrangler.toml` file:

```toml
[durable_objects]
bindings = [
  { name = "ChatAgent", class_name = "ChatAgent" },
  { name = "AssistantAgent", class_name = "AssistantAgent" }
]

[[migrations]]
tag = "v1"
new_sqlite_classes = ["ChatAgent", "AssistantAgent"]
```

## How It Works

The `agentsMiddleware` function:

1. Detects whether the incoming request is a WebSocket connection or standard HTTP request
2. Routes the request to the appropriate agent
3. Handles WebSocket upgrades for persistent connections
4. Provides error handling and custom routing options

Agents can:

- Maintain state across requests
- Handle both HTTP and WebSocket connections
- Schedule tasks for future execution
- Communicate with AI services
- Integrate seamlessly with React applications

## License

ISC

## Credits

Thanks to Cloudflare for developing the Agents framework and for the inspiration from projects like PartyKit that pioneered these patterns.

---
