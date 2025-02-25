import { type Message, useChat } from "@ai-sdk/react";
import { APPROVAL, getToolsRequiringConfirmation } from "./utils";
import { tools } from "./tools";
import "./styles.css";
import { useEffect, useState, useRef } from "react";
import { useAgent } from "agents-sdk/react";
import { useAgentChat } from "agents-sdk/ai-react";

export default function Chat() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Set initial theme
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  // Scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const agent = useAgent({
    agent: "human-in-the-loop",
  });

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    addToolResult,
    clearHistory,
  } = useAgentChat({
    agent,
    maxSteps: 5,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

  const pendingToolCallConfirmation = messages.some((m: Message) =>
    m.parts?.some(
      (part) =>
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "call" &&
        toolsRequiringConfirmation.includes(part.toolInvocation.toolName)
    )
  );

  return (
    <>
      <div className="controls-container">
        <button
          onClick={toggleTheme}
          className="theme-switch"
          data-theme={theme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <div className="theme-switch-handle" />
        </button>
        <button onClick={clearHistory} className="clear-history">
          🗑️ Clear History
        </button>
      </div>

      <div className="chat-container">
        <div className="messages-wrapper">
          {messages?.map((m: Message) => (
            <div key={m.id} className="message">
              <strong>{`${m.role}: `}</strong>
              {m.parts?.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <div key={i} className="message-content">
                        {part.text}
                      </div>
                    );
                  case "tool-invocation":
                    const toolInvocation = part.toolInvocation;
                    const toolCallId = toolInvocation.toolCallId;

                    // render confirmation tool (client-side tool with user interaction)
                    if (
                      toolsRequiringConfirmation.includes(
                        toolInvocation.toolName
                      ) &&
                      toolInvocation.state === "call"
                    ) {
                      return (
                        <div key={toolCallId} className="tool-invocation">
                          Run{" "}
                          <span className="dynamic-info">
                            {toolInvocation.toolName}
                          </span>{" "}
                          with args:{" "}
                          <span className="dynamic-info">
                            {JSON.stringify(toolInvocation.args)}
                          </span>
                          <div className="button-container">
                            <button
                              className="button-approve"
                              onClick={() =>
                                addToolResult({
                                  toolCallId,
                                  result: APPROVAL.YES,
                                })
                              }
                            >
                              Yes
                            </button>
                            <button
                              className="button-reject"
                              onClick={() =>
                                addToolResult({
                                  toolCallId,
                                  result: APPROVAL.NO,
                                })
                              }
                            >
                              No
                            </button>
                          </div>
                        </div>
                      );
                    }
                }
              })}
              <br />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit}>
          <input
            disabled={pendingToolCallConfirmation}
            className="chat-input"
            value={input}
            placeholder="Say something..."
            onChange={handleInputChange}
          />
        </form>
      </div>
    </>
  );
}
