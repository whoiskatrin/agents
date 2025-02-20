import "./styles.css";
import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { useAgent } from "@cloudflare/agents/react";
import type { IncomingMessage, OutgoingMessage, ScheduledItem } from "./shared";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className={`toast toast-${type}`}>{message}</div>;
}

function App() {
  const agent = useAgent({
    agent: "scheduler",
    onMessage: (message) => {
      const parsedMessage = JSON.parse(message.data) as OutgoingMessage;
      if (parsedMessage.type === "schedules") {
        setScheduledItems(parsedMessage.data);
      } else if (parsedMessage.type === "run-schedule") {
        addToast(`Running schedule ${parsedMessage.data.description}`, "info");
        if (parsedMessage.data.type !== "cron") {
          // remove the schedule from the list
          setScheduledItems((items) =>
            items.filter((item) => item.id !== parsedMessage.data.id)
          );
        }
      } else if (parsedMessage.type === "error") {
        addToast(parsedMessage.data, "error");
      } else if (parsedMessage.type === "schedule") {
        setScheduledItems((items) => [...items, parsedMessage.data]);
      }
    },
  });

  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [input, setInput] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    const newToast: Toast = {
      id: crypto.randomUUID(),
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // const newItem: ScheduledItem = {
    //   id: crypto.randomUUID(),
    //   trigger: "in 5 seconds",
    //   nextTrigger: new Date(Date.now() + 5000),
    //   description: input.trim(),
    // };

    agent.send(
      JSON.stringify({
        type: "schedule",
        input: input,
      } satisfies IncomingMessage)
    );

    // setScheduledItems([...scheduledItems, newItem]);
    setInput("");
    // addToast("Task scheduled successfully");
  };

  const handleDelete = (id: string) => {
    agent.send(
      JSON.stringify({
        type: "delete-schedule",
        id,
      } satisfies IncomingMessage)
    );
    setScheduledItems((items) => items.filter((item) => item.id !== id));
    addToast("Task removed", "info");
  };

  return (
    <div className="container">
      <div className="toasts-container">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="inputForm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your schedule in natural language..."
          className="scheduleInput"
        />
      </form>

      <div className="itemsList">
        {scheduledItems.map((item) => (
          <div key={item.id} className="scheduledItem">
            <div className="itemContent">
              <div className="itemDetails">
                <span className="trigger">Trigger: {item.trigger}</span>
                <span className="nextTrigger">
                  Next: {item.nextTrigger.toLocaleString()}
                </span>
                <span className="description">{item.description}</span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="deleteButton"
                aria-label="Delete item"
              >
                ⨉
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
