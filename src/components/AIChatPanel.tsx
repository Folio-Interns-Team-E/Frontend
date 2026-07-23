import { FormEvent, useEffect, useRef, useState } from "react";
import {
  fetchChatMessages,
  sendChatMessage,
  createChatRemote,
  deleteChatRemote,
  renameChatRemote,
} from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { switchChat } from "../store/appSlice";

const THINKING_MESSAGES = [
  "🔌 Plugging into the ICP engine",
  "🧠 Reading between the lines",
  "🔍 Digging through workspace data",
  "💭 Letting it marinate",
  "🕸️ Cross-referencing your leads",
  "⚖️ Weighing the best response",
  "⚙️ Running the AI pipeline",
  "✨ Almost there",
];

export function AIChatPanel({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.app.assistantMessages);
  const chats = useAppSelector((state) => state.app.chats);
  const activeChatId = useAppSelector((state) => state.app.activeChatId);
  const chatMessagesStatus = useAppSelector((state) => state.app.chatMessagesStatus);
  const [message, setMessage] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [thinkingText, setThinkingText] = useState(THINKING_MESSAGES[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSending = messages.some((m) => m.body === "Thinking...");

  useEffect(() => {
    if (activeChatId) {
      dispatch(fetchChatMessages());
    }
  }, [dispatch, activeChatId]);

  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stepIdx]);

  useEffect(() => {
  if (!isSending) {
    setStepIdx(0);
    return;
  }

  setStepIdx(0);

  const interval = setInterval(() => {
    setStepIdx((prev) => {
      if (prev < THINKING_MESSAGES.length - 1) {
        return prev + 1;
      }
      clearInterval(interval);
      return prev;
    });
  }, 1200); // Adjusted to 1.2s for a snappier feel

  return () => clearInterval(interval);
}, [isSending]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setRenamingId(null);
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  async function handleNewChat() {
    const result = await dispatch(createChatRemote("New Chat"));
    if (createChatRemote.fulfilled.match(result)) {
      dispatch(switchChat(result.payload.id));
    }
    setShowDropdown(false);
  }

  function handleSwitchChat(chatId: string) {
    dispatch(switchChat(chatId));
    setShowDropdown(false);
    setRenamingId(null);
  }

  function handleDeleteChat(chatId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (chats.length <= 1) return;
    dispatch(deleteChatRemote(chatId));
  }

  function handleRenameStart(chatId: string, currentName: string, e: React.MouseEvent) {
    e.stopPropagation();
    setRenamingId(chatId);
    setRenameValue(currentName);
  }

  function handleRenameSubmit(chatId: string) {
    if (renameValue.trim()) {
      dispatch(renameChatRemote({ chatId, chatName: renameValue.trim() }));
    }
    setRenamingId(null);
  }

  async function doSend(value: string) {
    if (!activeChatId) {
      const result = await dispatch(createChatRemote("New Chat"));
      if (createChatRemote.fulfilled.match(result)) {
        dispatch(switchChat(result.payload.id));
        setTimeout(() => dispatch(sendChatMessage(value)), 100);
      }
      return;
    }
    dispatch(sendChatMessage(value));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = message.trim();
    if (!value || isSending) return;
    setMessage("");
    doSend(value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const value = message.trim();
      if (!value || isSending) return;
      setMessage("");
      doSend(value);
    }
  }

  const activeChatName = chats.find((c) => c.id === activeChatId)?.chat_name || "New Chat";

  return (
    <aside className="fixed right-0 top-0 z-40 flex h-full w-full max-w-[380px] flex-col border-l border-outline-variant/45 bg-white shadow-[-16px_0_40px_rgba(15,23,42,0.08)] xl:z-20 xl:w-[var(--spacing-ai_panel_width)]">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-outline-variant/40 px-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-on-surface">Salsy AI</h3>
            <p className="text-[10px] font-medium text-on-surface-variant">{activeChatName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 relative" ref={dropdownRef}>
          <button
            className="icon-button"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Chat history"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
          </button>
          <button className="icon-button" onClick={onClose} aria-label="Close AI sidebar">
            <span className="material-symbols-outlined text-[18px]">right_panel_close</span>
          </button>

          {/* Chat dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-outline-variant/40 bg-white shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-outline-variant/20 px-3 py-2">
                <span className="text-xs font-bold text-on-surface">Your chats</span>
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary transition hover:bg-primary/20"
                >
                  <span className="material-symbols-outlined text-[12px]">add</span>
                  New
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {chats.length === 0 && (
                  <p className="px-3 py-4 text-center text-[11px] text-on-surface-variant">
                    No chats yet
                  </p>
                )}
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleSwitchChat(chat.id)}
                    className={`group flex cursor-pointer items-center gap-2 px-3 py-2.5 transition ${
                      chat.id === activeChatId
                        ? "bg-primary/8 font-bold text-primary"
                        : "font-medium text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] opacity-50">
                      chat_bubble
                    </span>
                    {renamingId === chat.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameSubmit(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSubmit(chat.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="min-w-0 flex-1 bg-white border border-primary/30 rounded px-1.5 py-0.5 text-xs outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-xs">{chat.chat_name}</span>
                    )}
                    {chats.length > 1 && (
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          onClick={(e) => handleRenameStart(chat.id, chat.chat_name, e)}
                          className="icon-button !h-5 !w-5"
                          aria-label="Rename chat"
                        >
                          <span className="material-symbols-outlined text-[12px]">edit</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="icon-button !h-5 !w-5 text-red-500"
                          aria-label="Delete chat"
                        >
                          <span className="material-symbols-outlined text-[12px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] p-4">
        {chatMessagesStatus === "loading" && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex flex-col ${i % 2 === 0 ? "items-end" : "items-start"}`}>
                <div className="mb-1 h-2.5 w-16 rounded bg-outline-variant/40" />
                <div
                  className={`rounded-2xl p-3 ${i % 2 === 0 ? "rounded-tr-md" : "rounded-tl-md"}`}
                >
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-48 rounded bg-outline-variant/30" />
                    <div className="h-2.5 w-32 rounded bg-outline-variant/20" />
                  </div>
                </div>
                <div className="mt-1 h-2 w-12 rounded bg-outline-variant/20" />
              </div>
            ))}
          </div>
        )}
        {chatMessagesStatus !== "loading" && messages.length === 0 && (
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
            <p
              className={`mb-1 px-1 text-[10px] font-bold ${
                item.author === "user" ? "text-on-surface-variant" : "text-primary"
              }`}
            >
              {item.author === "user" ? item.userName: `Salsy`}
            </p>
            {item.body === "Thinking..." ? (
  <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-primary/16 bg-primary/[0.065] p-3 shadow-sm">
    <div className="flex items-center gap-2.5">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent shrink-0" />
      <span
        key={stepIdx}
        className="text-xs font-medium text-primary animate-in fade-in duration-200"
      >
        {THINKING_MESSAGES[stepIdx]}
      </span>
    </div>
  </div>
) : (
  <div
    className={`max-w-[92%] rounded-2xl p-3 shadow-sm ${
      item.author === "user"
        ? "rounded-tr-md border border-outline-variant/55 bg-white"
        : "rounded-tl-md border border-primary/16 bg-primary/[0.065]"
    }`}
  >
    <p className="whitespace-pre-line font-body-sm text-body-sm">{item.body}</p>
  </div>
)}
            {item.body !== "Thinking..." && (
              <span className="text-[10px] text-outline mt-1 px-1">{item.time}</span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-outline-variant/45 bg-white p-4">
        <form className="relative flex items-center" onSubmit={handleSubmit}>
          <textarea
            className="custom-scrollbar w-full resize-none rounded-xl border border-outline-variant/65 bg-slate-50 py-3 pl-4 pr-12 text-[12px] outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={isSending ? "Waiting for reply..." : "Ask the agent anything..."}
            rows={1}
            style={{ height: 42, overflowY: "hidden" }}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d2d39] text-white shadow-sm transition hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed"
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
