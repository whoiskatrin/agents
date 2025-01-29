import { useEffect, useState } from "react";
import { usePartySocket } from "partysocket/react";
import "./app.css";

type WorkflowState = {
  isRunning: boolean;
  output: string;
};

type WorkflowType =
  | "sequential"
  | "routing"
  | "parallel"
  | "orchestrator"
  | "evaluator";

type PatternProps = {
  type: WorkflowType;
  title: string;
  description: string;
  image: string;
  index: number;
};

type FormState = {
  sequential: { input: string };
  routing: { query: string };
  parallel: { code: string };
  orchestrator: { featureRequest: string };
  evaluator: { text: string; targetLanguage: string };
};

const LANGUAGES = [
  { value: "french", label: "French" },
  { value: "spanish", label: "Spanish" },
  { value: "japanese", label: "Japanese" },
  { value: "german", label: "German" },
  { value: "mandarin", label: "Mandarin Chinese" },
  { value: "arabic", label: "Arabic" },
  { value: "russian", label: "Russian" },
  { value: "italian", label: "Italian" },
  { value: "klingon", label: "Klingon" },
  { value: "portuguese", label: "Portuguese" },
] as const;

function PatternSection({
  type,
  title,
  description,
  image,
  index,
}: PatternProps) {
  const socket = usePartySocket({
    party: type,
    room: "default-room",
    onMessage: (e) => {
      const data = JSON.parse(e.data);
      console.log(data);
      switch (data.type) {
        case "state":
          setWorkflowState(data.state);
          break;
      }
    },
  });

  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    isRunning: false,
    output: "",
  });

  const runWorkflow = async () => {
    setWorkflowState((prev) => ({ ...prev, isRunning: true }));

    // Simulate API delay
    // await new Promise((resolve) => setTimeout(resolve, 2000));

    setWorkflowState((state) => ({
      ...state,
      isRunning: false,
    }));

    socket.send(
      JSON.stringify({
        type: "run",
        input: formState,
      })
    );
  };

  const [formState, setFormState] = useState<FormState[typeof type]>(() => {
    switch (type) {
      case "sequential":
        return { input: "Our new AI-powered productivity app" };
      case "routing":
        return { query: "How do I reset my password?" };
      case "parallel":
        return {
          code: `function processUserData(data) {
  // TODO: Add validation
  database.save(data);
  return true;
}`,
        };
      case "orchestrator":
        return {
          featureRequest:
            "Add dark mode support to the dashboard, including theme persistence and system preference detection",
        };
      case "evaluator":
        return {
          text: "The early bird catches the worm",
          targetLanguage: LANGUAGES[0].value,
        };
    }
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const getFormContent = () => {
    if (type === "sequential") {
      const state = formState as FormState["sequential"];
      return (
        <div className="form-group">
          <label htmlFor="sequential-input">Marketing Copy Input</label>
          <input
            id="sequential-input"
            type="text"
            name="input"
            value={state.input}
            onChange={handleInputChange}
            placeholder="e.g., 'Our new AI-powered productivity app'"
            className="workflow-input"
          />
          <small className="input-help">
            Enter a product or service to generate marketing copy for
          </small>
        </div>
      );
    }

    if (type === "routing") {
      const state = formState as FormState["routing"];
      return (
        <div className="form-group">
          <label htmlFor="routing-query">Customer Query</label>
          <input
            id="routing-query"
            type="text"
            name="query"
            value={state.query}
            onChange={handleInputChange}
            placeholder="e.g., 'How do I reset my password?'"
            className="workflow-input"
          />
          <small className="input-help">
            Enter a customer support question to be routed
          </small>
        </div>
      );
    }

    if (type === "parallel") {
      const state = formState as FormState["parallel"];
      return (
        <div className="form-group">
          <label htmlFor="parallel-code">Code for Review</label>
          <textarea
            id="parallel-code"
            name="code"
            value={state.code}
            onChange={handleInputChange}
            placeholder={`e.g.,\nfunction processUserData(data) {\n  // TODO: Add validation\n  database.save(data);\n  return true;\n}`}
            className="workflow-input workflow-textarea"
            rows={4}
          />
          <small className="input-help">
            Enter code snippet for parallel security, performance, and
            maintainability review
          </small>
        </div>
      );
    }

    if (type === "orchestrator") {
      const state = formState as FormState["orchestrator"];
      return (
        <div className="form-group">
          <label htmlFor="orchestrator-request">Feature Request</label>
          <textarea
            id="orchestrator-request"
            name="featureRequest"
            value={state.featureRequest}
            onChange={handleInputChange}
            placeholder="e.g., 'Add dark mode support to the dashboard, including theme persistence and system preference detection'"
            className="workflow-input workflow-textarea"
            rows={4}
          />
          <small className="input-help">
            Describe the feature to be implemented across multiple files
          </small>
        </div>
      );
    }

    if (type === "evaluator") {
      const state = formState as FormState["evaluator"];
      return (
        <>
          <div className="form-group">
            <label htmlFor="evaluator-text">Text to Translate</label>
            <textarea
              id="evaluator-text"
              name="text"
              value={state.text}
              onChange={handleInputChange}
              placeholder="e.g., 'The early bird catches the worm'"
              className="workflow-input workflow-textarea"
              rows={4}
            />
            <small className="input-help">
              Enter text to be translated and optimized
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="evaluator-language">Target Language</label>
            <select
              id="evaluator-language"
              name="targetLanguage"
              value={state.targetLanguage}
              onChange={handleInputChange}
              className="workflow-input"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <small className="input-help">
              Select the language to translate into
            </small>
          </div>
        </>
      );
    }
  };

  const getExampleOutput = () => {
    if (type === "sequential") {
      const state = formState as FormState["sequential"];
      return `Processing marketing copy for: "${state.input}"\n1. Generating initial copy...\n2. Evaluating quality metrics...\n3. Final output: Compelling marketing message created`;
    }
    if (type === "routing") {
      const state = formState as FormState["routing"];
      return `Analyzing query: "${state.query}"\nRouting to appropriate department...\nGenerating specialized response...`;
    }
    if (type === "parallel") {
      const state = formState as FormState["parallel"];
      return `Running parallel code reviews for:\n${state.code}\nSecurity Review: Complete\nPerformance Review: Complete\nMaintainability Review: Complete`;
    }
    if (type === "orchestrator") {
      const state = formState as FormState["orchestrator"];
      return `Planning implementation for: "${state.featureRequest}"\n1. Analyzing requirements\n2. Breaking down tasks\n3. Assigning to workers`;
    }
    if (type === "evaluator") {
      const state = formState as FormState["evaluator"];
      return `Translating text to ${state.targetLanguage}:\n"${state.text}"\nGenerating translation...\nEvaluating quality...\nRefining output...`;
    }
    return "";
  };

  const formatOutput = (output: string) => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(output);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If not JSON, return as is
      return output;
    }
  };

  return (
    <section className="pattern-section">
      <h2>
        {index + 1}. {title}
      </h2>
      <div className="pattern-content">
        <div className="pattern-image">
          <img src={image} alt={`${title} workflow diagram`} />
        </div>
        <p className="pattern-description">{description}</p>
        <div className="workflow-runner">
          <div className="workflow-form">{getFormContent()}</div>
          <div className="workflow-toolbar">
            <button
              className="run-button"
              onClick={runWorkflow}
              disabled={workflowState.isRunning}
            >
              {workflowState.isRunning ? (
                <>
                  <div className="spinner" />
                  Running...
                </>
              ) : workflowState.output ? (
                "Run Again"
              ) : (
                "Run Workflow"
              )}
            </button>
          </div>
          <pre className="workflow-output">
            {workflowState.output
              ? formatOutput(workflowState.output)
              : `Enter input above and click 'Run Workflow' to see ${title} in action`}
          </pre>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Check for user's preferred color scheme
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setTheme(prefersDark ? "dark" : "light");

    // Add theme to document
    document.documentElement.setAttribute(
      "data-theme",
      prefersDark ? "dark" : "light"
    );
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const patterns = {
    sequential: {
      title: "Prompt Chaining",
      description:
        "Decomposes tasks into a sequence of steps, where each LLM call processes the output of the previous one.",
      image: "/flows/01 sequential.png",
    },
    routing: {
      title: "Routing",
      description:
        "Classifies input and directs it to specialized followup tasks, allowing for separation of concerns.",
      image: "/flows/02 routing.png",
    },
    parallel: {
      title: "Parallelization",
      description:
        "Enables simultaneous task processing through sectioning or voting mechanisms.",
      image: "/flows/03 parallel.png",
    },
    orchestrator: {
      title: "Orchestrator-Workers",
      description:
        "A central LLM dynamically breaks down tasks, delegates to worker LLMs, and synthesizes results.",
      image: "/flows/04 orchestrator.png",
    },
    evaluator: {
      title: "Evaluator-Optimizer",
      description:
        "One LLM generates responses while another provides evaluation and feedback in a loop.",
      image: "/flows/05 evaluator.png",
    },
  };

  return (
    <div className="container">
      <header>
        <div className="theme-toggle" onClick={toggleTheme}>
          <span className="theme-toggle-icon">
            {theme === "light" ? "🌞" : "🌙"}
          </span>
          <div className="theme-toggle-switch" />
        </div>
        <h1>⛅️ Building Effective Agents</h1>
        <p>Common patterns for implementing AI agents</p>
        <div className="header-links">
          <p>
            Based on{" "}
            <a
              href="https://www.anthropic.com/research/building-effective-agents"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic's research
            </a>{" "}
            on agent patterns.
          </p>
          <p>
            Code samples from{" "}
            <a
              href="https://sdk.vercel.ai/docs/foundations/agents"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel's AI SDK
            </a>
            , running in Cloudflare's Durable Objects.
          </p>
        </div>
      </header>

      <main>
        {(
          Object.entries(patterns) as [
            WorkflowType,
            (typeof patterns)[keyof typeof patterns]
          ][]
        ).map(([type, pattern], index) => (
          <PatternSection
            key={type}
            type={type}
            title={pattern.title}
            description={pattern.description}
            image={pattern.image}
            index={index}
          />
        ))}
      </main>

      <section className="durable-objects-intro">
        <h2>Why Durable Objects?</h2>
        <p>
          Cloudflare's Durable Objects provide the perfect environment for
          hosting AI agents:
        </p>

        <div className="benefits-grid">
          <div className="benefit-card">
            <h3>Persistent State</h3>
            <p>
              Agents continue running even when browser tabs are closed or
              refreshed, maintaining their state and context throughout
              long-running tasks.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Real-time Updates</h3>
            <p>
              WebSocket connections enable live streaming of agent progress,
              thoughts, and results directly to any connected client, providing
              immediate feedback.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Global Scale</h3>
            <p>
              Agents run at the edge, automatically scaling across Cloudflare's
              worldwide network, ensuring low-latency responses regardless of
              user location.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Flexible Triggers</h3>
            <p>
              Agents can be activated through various means: HTTP requests,
              scheduled cron jobs, email handlers, or other server-side events.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Memory Isolation</h3>
            <p>
              Each agent runs in its own isolated environment, preventing
              resource contention and ensuring reliable performance.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Cost Effective</h3>
            <p>
              Pay only for the compute time your agents use, with no idle costs
              and automatic scaling based on demand.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
