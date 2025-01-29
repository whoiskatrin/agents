import { useEffect, useState } from "react";
import "./app.css";

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

  return (
    <div className="container">
      <header>
        <div className="theme-toggle" onClick={toggleTheme}>
          <span className="theme-toggle-icon">
            {theme === "light" ? "🌞" : "🌙"}
          </span>
          <div className="theme-toggle-switch" />
        </div>
        <h1>Building Effective Agents</h1>
        <p>Common patterns for implementing AI agents</p>
      </header>

      <main>
        <section className="pattern-section">
          <h2>1. Prompt Chaining</h2>
          <div className="pattern-content">
            <img
              src="/flows/01 sequential.png"
              alt="Sequential workflow diagram"
            />
            <p>
              Decomposes tasks into a sequence of steps, where each LLM call
              processes the output of the previous one.
            </p>
          </div>
        </section>

        <section className="pattern-section">
          <h2>2. Routing</h2>
          <div className="pattern-content">
            <img src="/flows/02 routing.png" alt="Routing workflow diagram" />
            <p>
              Classifies input and directs it to specialized followup tasks,
              allowing for separation of concerns.
            </p>
          </div>
        </section>

        <section className="pattern-section">
          <h2>3. Parallelization</h2>
          <div className="pattern-content">
            <img src="/flows/03 parallel.png" alt="Parallel workflow diagram" />
            <p>
              Enables simultaneous task processing through sectioning or voting
              mechanisms.
            </p>
          </div>
        </section>

        <section className="pattern-section">
          <h2>4. Orchestrator-Workers</h2>
          <div className="pattern-content">
            <img
              src="/flows/04 orchestrator.png"
              alt="Orchestrator workflow diagram"
            />
            <p>
              A central LLM dynamically breaks down tasks, delegates to worker
              LLMs, and synthesizes results.
            </p>
          </div>
        </section>

        <section className="pattern-section">
          <h2>5. Evaluator-Optimizer</h2>
          <div className="pattern-content">
            <img
              src="/flows/05 evaluator.png"
              alt="Evaluator workflow diagram"
            />
            <p>
              One LLM generates responses while another provides evaluation and
              feedback in a loop.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
