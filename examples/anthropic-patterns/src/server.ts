// implementing https://www.anthropic.com/research/building-effective-agents

import {
  Server,
  routePartykitRequest,
  Connection,
  WSMessage,
} from "partyserver";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { z } from "zod";

const openai = createOpenAI({
  // @ts-ignore we are replacing this at build time
  apiKey: process.env.OPENAI_API_KEY,
});

type Env = {
  Sequential: DurableObjectNamespace<Server<Env>>;
  Routing: DurableObjectNamespace<Server<Env>>;
  Parallel: DurableObjectNamespace<Server<Env>>;
  Orchestrator: DurableObjectNamespace<Server<Env>>;
  Evaluator: DurableObjectNamespace<Server<Env>>;
};

// createAgent is a helper function to generate an agent class
// with helpers for sending/receiving messages to the client and updating the state
function createAgent(
  name: string,
  workflow: (props: any, toast: (message: string) => void) => Promise<any>
) {
  return class Agent extends Server<Env> {
    static options = {
      hibernate: true,
    };
    state: {
      isRunning: boolean;
      output: any;
    } = {
      isRunning: false,
      output: undefined,
    };

    onConnect(connection: Connection) {
      connection.send(
        JSON.stringify({
          type: "state",
          state: this.state,
        })
      );
    }

    toast = (message: string, type: "info" | "error" = "info") => {
      this.broadcast(
        JSON.stringify({
          type: "toast",
          toast: {
            message,
            type,
          },
        })
      );
    };

    onMessage(connection: Connection, message: WSMessage) {
      const data = JSON.parse(message as string);
      switch (data.type) {
        case "run":
          this.run({ input: data.input });
          break;
        default:
          console.error("Unknown message type", data.type);
      }
    }

    setState(state: typeof this.state) {
      this.state = state;
      this.broadcast(JSON.stringify({ type: "state", state: this.state }));
    }

    async run(data: { input: any }) {
      if (this.state.isRunning) return;
      this.setState({ isRunning: true, output: undefined });

      try {
        const result = await workflow(data.input, this.toast);
        this.setState({ isRunning: false, output: JSON.stringify(result) });
      } catch (error) {
        this.toast(`An error occurred: ${error}`);
        this.setState({ isRunning: false, output: JSON.stringify(error) });
      }
    }
  };
}

// Here are the patterns, implemented as simple async functions
// These were copied directly from the AI SDK examples
// https://sdk.vercel.ai/docs/foundations/agents

// A SequentialProcessing class to process tasks in a sequential manner
export const Sequential = createAgent(
  "Sequential",
  async (props: { input: string }, toast: (message: string) => void) => {
    // This agent uses a prompt chaining workflow, ideal for tasks that can be decomposed into fixed subtasks.
    // It trades off latency for higher accuracy by making each LLM call an easier task.
    const model = openai("gpt-4o");

    // First step: Generate marketing copy
    const { text: copy } = await generateText({
      model,
      prompt: `Write persuasive marketing copy for: ${props.input}. Focus on benefits and emotional appeal.`,
    });
    toast("Copy generated");

    // Perform quality check on copy
    const { object: qualityMetrics } = await generateObject({
      model,
      schema: z.object({
        hasCallToAction: z.boolean(),
        emotionalAppeal: z.number().min(1).max(10),
        clarity: z.number().min(1).max(10),
      }),
      prompt: `Evaluate this marketing copy for:
      1. Presence of call to action (true/false)
      2. Emotional appeal (1-10)
      3. Clarity (1-10)
  
      Copy to evaluate: ${copy}`,
    });
    toast("Quality check complete");
    // If quality check fails, regenerate with more specific instructions
    if (
      !qualityMetrics.hasCallToAction ||
      qualityMetrics.emotionalAppeal < 7 ||
      qualityMetrics.clarity < 7
    ) {
      const { text: improvedCopy } = await generateText({
        model,
        prompt: `Rewrite this marketing copy with:
        ${!qualityMetrics.hasCallToAction ? "- A clear call to action" : ""}
        ${
          qualityMetrics.emotionalAppeal < 7
            ? "- Stronger emotional appeal"
            : ""
        }
        ${qualityMetrics.clarity < 7 ? "- Improved clarity and directness" : ""}
  
        Original copy: ${copy}`,
      });
      return { copy: improvedCopy, qualityMetrics };
    }

    toast("Copy improved");

    return { copy, qualityMetrics };
  }
);

// A Routing class to route tasks to the appropriate agent
export const Routing = createAgent(
  "Routing",
  async (props: { query: string }, toast: (message: string) => void) => {
    // This agent uses a routing workflow, which classifies input and directs it to specialized follow-up tasks.
    // It is effective for complex tasks with distinct categories that are better handled separately.
    const model = openai("gpt-4o");

    // First step: Classify the query type
    const { object: classification } = await generateObject({
      model,
      schema: z.object({
        reasoning: z.string(),
        type: z.enum(["general", "refund", "technical"]),
        complexity: z.enum(["simple", "complex"]),
      }),
      prompt: `Classify this customer query:
      ${props.query}
  
      Determine:
      1. Query type (general, refund, or technical)
      2. Complexity (simple or complex)
      3. Brief reasoning for classification`,
    });
    toast("Query classified");
    // Route based on classification
    // Set model and system prompt based on query type and complexity
    const { text: response } = await generateText({
      model:
        classification.complexity === "simple"
          ? openai("gpt-4o-mini")
          : openai("o1-mini"),
      system: {
        general:
          "You are an expert customer service agent handling general inquiries.",
        refund:
          "You are a customer service agent specializing in refund requests. Follow company policy and collect necessary information.",
        technical:
          "You are a technical support specialist with deep product knowledge. Focus on clear step-by-step troubleshooting.",
      }[classification.type],
      prompt: props.query,
    });
    toast("Response generated");
    return { response, classification };
  }
);

// A ParallelProcessing class to process tasks in parallel
export const Parallel = createAgent(
  "Parallel",
  async (props: { code: string }, toast: (message: string) => void) => {
    // This agent uses a parallelization workflow, effective for tasks that can be divided into independent subtasks.
    // It allows for speed and multiple perspectives, improving confidence in results.
    const model = openai("gpt-4o");

    // Run parallel reviews
    const [securityReview, performanceReview, maintainabilityReview] =
      await Promise.all([
        generateObject({
          model,
          system:
            "You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues.",
          schema: z.object({
            vulnerabilities: z.array(z.string()),
            riskLevel: z.enum(["low", "medium", "high"]),
            suggestions: z.array(z.string()),
          }),
          prompt: `Review this code:
      ${props.code}`,
        }),

        generateObject({
          model,
          system:
            "You are an expert in code performance. Focus on identifying performance bottlenecks, memory leaks, and optimization opportunities.",
          schema: z.object({
            issues: z.array(z.string()),
            impact: z.enum(["low", "medium", "high"]),
            optimizations: z.array(z.string()),
          }),
          prompt: `Review this code:
      ${props.code}`,
        }),

        generateObject({
          model,
          system:
            "You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.",
          schema: z.object({
            concerns: z.array(z.string()),
            qualityScore: z.number().min(1).max(10),
            recommendations: z.array(z.string()),
          }),
          prompt: `Review this code:
      ${props.code}`,
        }),
      ]);

    toast("Code reviews complete");

    const reviews = [
      { ...securityReview.object, type: "security" },
      { ...performanceReview.object, type: "performance" },
      { ...maintainabilityReview.object, type: "maintainability" },
    ];

    // Aggregate results using another model instance
    const { text: summary } = await generateText({
      model,
      system: "You are a technical lead summarizing multiple code reviews.",
      prompt: `Synthesize these code review results into a concise summary with key actions:
    ${JSON.stringify(reviews, null, 2)}`,
    });

    toast("Code review summary complete");

    return { reviews, summary };
  }
);

// An OrchestratorWorker class to orchestrate the workers
export const Orchestrator = createAgent(
  "Orchestrator",
  async (
    props: { featureRequest: string },
    toast: (message: string) => void
  ) => {
    // This agent uses an orchestrator-workers workflow, suitable for complex tasks where subtasks aren't pre-defined.
    // It dynamically breaks down tasks and delegates them to worker LLMs, synthesizing their results.
    const { object: implementationPlan } = await generateObject({
      model: openai("o1"),
      schema: z.object({
        files: z.array(
          z.object({
            purpose: z.string(),
            filePath: z.string(),
            changeType: z.enum(["create", "modify", "delete"]),
          })
        ),
        estimatedComplexity: z.enum(["low", "medium", "high"]),
      }),
      system:
        "You are a senior software architect planning feature implementations.",
      prompt: `Analyze this feature request and create an implementation plan:
      ${props.featureRequest}`,
    });
    toast("Implementation plan created");
    // Workers: Execute the planned changes
    const fileChanges = await Promise.all(
      implementationPlan.files.map(async (file) => {
        // Each worker is specialized for the type of change
        const workerSystemPrompt = {
          create:
            "You are an expert at implementing new files following best practices and project patterns.",
          modify:
            "You are an expert at modifying existing code while maintaining consistency and avoiding regressions.",
          delete:
            "You are an expert at safely removing code while ensuring no breaking changes.",
        }[file.changeType];

        const { object: change } = await generateObject({
          model: openai("gpt-4o"),
          schema: z.object({
            explanation: z.string(),
            code: z.string(),
          }),
          system: workerSystemPrompt,
          prompt: `Implement the changes for ${file.filePath} to support:
          ${file.purpose}
  
          Consider the overall feature context:
          ${props.featureRequest}`,
        });
        toast("File change implemented");
        return {
          file,
          implementation: change,
        };
      })
    );

    toast("File changes implemented");
    return {
      plan: implementationPlan,
      changes: fileChanges,
    };
  }
);

// An EvaluatorOptimizer class to evaluate and optimize the agents
export const Evaluator = createAgent(
  "Evaluator",
  async (
    props: { text: string; targetLanguage: string },
    toast: (message: string) => void
  ) => {
    const model = openai("gpt-4o");

    let currentTranslation = "";
    let iterations = 0;
    const MAX_ITERATIONS = 1;

    // Initial translation
    const { text: translation } = await generateText({
      model: openai("gpt-4o-mini"), // use small model for first attempt
      system: "You are an expert literary translator.",
      prompt: `Translate this text to ${props.targetLanguage}, preserving tone and cultural nuances:
      ${props.text}`,
    });

    toast("Initial translation complete");

    currentTranslation = translation;

    // Evaluation-optimization loop
    while (iterations < MAX_ITERATIONS) {
      // Evaluate current translation
      const { object: evaluation } = await generateObject({
        model,
        schema: z.object({
          qualityScore: z.number().min(1).max(10),
          preservesTone: z.boolean(),
          preservesNuance: z.boolean(),
          culturallyAccurate: z.boolean(),
          specificIssues: z.array(z.string()),
          improvementSuggestions: z.array(z.string()),
        }),
        system: "You are an expert in evaluating literary translations.",
        prompt: `Evaluate this translation:
  
        Original: ${props.text}
        Translation: ${currentTranslation}
  
        Consider:
        1. Overall quality
        2. Preservation of tone
        3. Preservation of nuance
        4. Cultural accuracy`,
      });

      toast(`Evaluation complete: ${evaluation.qualityScore}`);

      // Check if quality meets threshold
      if (
        evaluation.qualityScore >= 8 &&
        evaluation.preservesTone &&
        evaluation.preservesNuance &&
        evaluation.culturallyAccurate
      ) {
        break;
      }

      // Generate improved translation based on feedback
      const { text: improvedTranslation } = await generateText({
        model: openai("gpt-4o"), // use a larger model
        system: "You are an expert literary translator.",
        prompt: `Improve this translation based on the following feedback:
        ${evaluation.specificIssues.join("\n")}
        ${evaluation.improvementSuggestions.join("\n")}
  
        Original: ${props.text}
        Current Translation: ${currentTranslation}`,
      });

      toast("Improved translation complete");

      currentTranslation = improvedTranslation;
      iterations++;
    }

    toast("Final translation complete");

    return {
      finalTranslation: currentTranslation,
      iterationsRequired: iterations,
    };
  }
);

export default {
  async fetch(request, env, ctx) {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
