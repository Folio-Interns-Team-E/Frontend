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
    <aside className="fixed right-0 top-0 z-40 flex h-full w-full max-w-[380px] flex-col border-l border-outline-variant/45 bg-white shadow-[-16px_0_40px_rgba(15,23,42,0.08)] xl:z-20 xl:w-[var(--spacing-ai_panel_width)]">
      <div className="flex h-16 items-center justify-between border-b border-outline-variant/40 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-on-surface">Sales copilot</h3>
            <p className="text-[10px] font-medium text-on-surface-variant">
              Workspace-aware assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="icon-button" aria-label="View chat history">
            <span className="material-symbols-outlined text-[18px]">history</span>
          </button>
          <button className="icon-button" onClick={onClose} aria-label="Close AI sidebar">
            <span className="material-symbols-outlined text-[18px]">right_panel_close</span>
          </button>
        </div>
      </div>
      <div className="border-b border-outline-variant/35 bg-surface-container-low/35 px-4 py-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          Suggested prompts
        </p>
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setMessage(prompt)}
              className="rounded-full border border-primary/18 bg-white px-2.5 py-1.5 text-[10px] font-bold text-primary shadow-sm transition hover:border-primary/35 hover:bg-primary/5"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-white text-primary shadow-sm">
              <span className="material-symbols-outlined">forum</span>
            </div>
            <p className="mt-4 text-sm font-extrabold">Start a conversation</p>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">
              Ask about your ICP, leads, meetings, or next best action.
            </p>
          </div>
        )}
        {messages.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col ${item.author === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[92%] rounded-2xl p-3 shadow-sm ${
                item.author === "user"
                  ? "rounded-tr-md border border-outline-variant/55 bg-white"
                  : "rounded-tl-md border border-primary/16 bg-primary/[0.065]"
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
      <div className="border-t border-outline-variant/45 bg-white p-4">
        <form className="relative flex items-center" onSubmit={handleSubmit}>
          <textarea
            className="custom-scrollbar w-full resize-none rounded-xl border border-outline-variant/65 bg-slate-50 py-3 pl-4 pr-12 text-[12px] outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            placeholder="Ask the agent anything..."
            rows={1}
            style={{ height: 42, overflowY: "hidden" }}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <button
            type="submit"
            className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d2d39] text-white shadow-sm transition hover:bg-primary"
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
