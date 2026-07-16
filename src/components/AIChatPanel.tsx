import { FormEvent, useEffect, useState } from "react";
import { fetchChatMessages, sendChatMessage } from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export function AIChatPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.app.assistantMessages);
  const [message, setMessage] = useState("");
  const prompts = ["Summarize ICP", "Find next action", "Draft follow-up"];

  useEffect(() => {
    dispatch(fetchChatMessages());
  }, [dispatch]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = message.trim();
    if (!value) return;
    dispatch(sendChatMessage(value));
    setMessage("");
  }

  return (
    <aside className="fixed right-0 top-0 z-20 flex h-full w-full md:w-[var(--spacing-ai_panel_width)] flex-col border-l border-white/70 bg-white/78 shadow-[-12px_0_36px_rgba(15,23,42,0.04)] backdrop-blur-2xl">
      <div className="flex h-16 items-center justify-between border-b border-outline-variant/50 px-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-18 font-extrabold text-on-surface">Sales copilot</h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="icon-button">
            <span className="material-symbols-outlined text-[18px]">history</span>
          </button>
          <button className="icon-button" onClick={onClose} aria-label="Close AI sidebar">
            <span className="material-symbols-outlined text-[18px]">right_panel_close</span>
          </button>
        </div>
      </div>
      <div className="border-b border-outline-variant/40 bg-white/60 px-4 py-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          Suggested prompts
        </p>
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setMessage(prompt)}
              className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary transition hover:bg-primary/10"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/70 to-white/50 p-4">
        {messages.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col ${item.author === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[92%] rounded-2xl p-3 shadow-sm ${
                item.author === "user"
                  ? "rounded-tr-md border border-outline-variant/60 bg-white"
                  : "rounded-tl-md border border-primary/15 bg-gradient-to-br from-primary/10 to-cyan-50"
              }`}
            >
              <p
                className={`text-[11px] font-bold mb-1 uppercase tracking-tight ${
                  item.author === "user" ? "text-on-surface-variant" : "text-primary"
                }`}
              >
                {item.author === "user" ? "You" : "AI Agent"}
              </p>
              <p className="whitespace-pre-line font-body-sm text-body-sm">{item.body}</p>
            </div>
            <span className="text-[10px] text-outline mt-1 px-1">{item.time}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-outline-variant/50 bg-white/85 p-4">
        <form className="relative flex items-center" onSubmit={handleSubmit}>
          <textarea
            className="custom-scrollbar w-full resize-none rounded-2xl border border-outline-variant/70 bg-slate-50 py-3 pl-4 pr-12 text-[12px] shadow-inner outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            placeholder="Ask the agent anything..."
            rows={1}
            style={{ height: 42, overflowY: "hidden" }}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <button
            type="submit"
            className="absolute right-0 flex items-center justify-center rounded-r-2xl bg-gradient-to-br from-primary to-[#16a3a9] p-2 text-white shadow-md shadow-primary/20 transition-transform hover:scale-105"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
        <p className="text-[10px] text-outline mt-2 text-center">
          AI can make mistakes. Verify important info.
        </p>
      </div>
    </aside>
  );
}
