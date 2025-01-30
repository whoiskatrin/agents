# Agent Patterns Demo

This project demonstrates different patterns for building AI agents, based on [Anthropic's research](https://www.anthropic.com/research/building-effective-agents), implemented using Cloudflare's Durable Objects and the [AI SDK](https://sdk.vercel.ai/).

## Overview

The demo showcases five fundamental patterns for building AI agents:

1. **Prompt Chaining**: Sequential processing where each step builds on the previous
2. **Routing**: Intelligent classification and routing of tasks
3. **Parallelization**: Concurrent execution of multiple subtasks
4. **Orchestrator-Workers**: Dynamic task breakdown and delegation
5. **Evaluator-Optimizer**: Iterative improvement through feedback loops

Each pattern is implemented as a Durable Object, providing persistence, real-time updates, and scalability.

## Architecture

### Frontend

- React application with TypeScript
- Real-time WebSocket connections to Durable Objects
- Dark mode support
- Responsive design

### Backend

- Cloudflare Durable Objects for agent state management
- WebSocket connections for live updates
- OpenAI integration via AI SDK
- PartyServer for WebSocket management

## Features

- **Live Agent Interaction**: Test each pattern with real inputs
- **Real-time Updates**: See agent progress as it happens
- **Persistent State**: Agents continue running even if you close the browser
- **Global Scaling**: Runs on Cloudflare's edge network
- **Dark Mode**: Supports system preferences and manual toggle

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your API keys:

   ```
   OPENAI_API_KEY=your_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

The application is designed to be deployed to Cloudflare Workers:

```bash
npm run deploy
```

## Implementation Details

### Durable Objects

Each pattern is implemented as a Durable Object class:

- `Sequential.ts`: Handles step-by-step processing
- `Routing.ts`: Manages query classification and routing
- `Parallel.ts`: Coordinates concurrent tasks
- `Orchestrator.ts`: Manages task delegation
- `Evaluator.ts`: Handles feedback loops

### WebSocket Communication

The frontend maintains WebSocket connections to each Durable Object instance. The websocket sends state updates to the frontend.

```typescript
const socket = usePartySocket({
  party: type,
  room: "default-room",
  onMessage: (e) => {
    const data = JSON.parse(e.data);
    switch (data.type) {
      case "state":
        setWorkflowState(data.state);
        break;
    }
  },
});
```

### State Management

Each Durable Object maintains its own state:

```typescript
state: {
  isRunning: boolean;
  output: any;
} = {
  isRunning: false,
  output: undefined,
};
```

## Why Durable Objects?

Durable Objects provide several key benefits for hosting AI agents:

1. **Persistence**: Agents continue running even when clients disconnect
2. **Real-time Updates**: WebSocket connections enable live progress streaming
3. **Global Scale**: Automatic distribution across Cloudflare's network
4. **Flexible Triggers**: Can be activated by HTTP, cron jobs, or other events
5. **Memory Isolation**: Each agent runs in its own environment
6. **Cost Effective**: Pay only for actual compute time used

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## License

MIT License - feel free to use this code in your own projects.

## Acknowledgments

- Based on research by [Anthropic](https://www.anthropic.com/research/building-effective-agents)
- Uses [AI SDK](https://sdk.vercel.ai/docs/foundations/agents)
- Built on [Cloudflare Workers](https://workers.cloudflare.com/) and [Durable Objects](https://developers.cloudflare.com/workers/learning/using-durable-objects)
