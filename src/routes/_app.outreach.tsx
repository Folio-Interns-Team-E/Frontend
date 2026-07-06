import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { sendEmail } from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/outreach")({
  head: () => ({
    meta: [
      { title: "Outreach · SalesSync AI" },
      {
        name: "description",
        content: "AI-drafted email outreach with tone adjustment and per-lead context.",
      },
    ],
  }),
  component: Outreach,
});

// --- 1. PROPS INTERFACE UPDATE ---
interface ComposerContentProps {
  email: string;
  subject: string;
  setSubject: (val: string) => void;
  body: string;
  updateBody: (val: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const ComposerContent = ({
  email,
  subject,
  setSubject,
  body,
  updateBody,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: ComposerContentProps) => (
  <>
    <div className="flex items-center gap-4 border-b border-outline-variant py-2 shrink-0">
      <span className="text-on-surface-variant font-mono-label w-12 text-xs tracking-wider">
        TO
      </span>
      <input
        className="flex-1 bg-transparent border-none focus:ring-0 text-body-base outline-none text-on-surface/80"
        readOnly
        type="text"
        value={email}
      />
    </div>

    {/* Toolbar Row containing Undo / Redo Actions */}
    <div className="flex items-center justify-between border-b border-outline-variant py-1 shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-on-surface-variant font-mono-label w-12 text-xs tracking-wider">
          SUBJ
        </span>
        <input
          className="flex-1 bg-transparent border-none focus:ring-0 text-body-base font-semibold outline-none"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-1 border-l border-outline-variant/60 pl-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <span className="material-symbols-outlined text-[18px] block">undo</span>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <span className="material-symbols-outlined text-[18px] block">redo</span>
        </button>
      </div>
    </div>

    <div className="flex-1 min-h-[180px] mt-2">
      <textarea
        className="w-full h-full bg-transparent border-none focus:ring-0 text-body-base leading-relaxed resize-none py-2 outline-none"
        placeholder="Write your email here..."
        value={body}
        onChange={(e) => updateBody(e.target.value)}
      />
    </div>

    <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant/30 shrink-0">
      <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">
        ADJUST TONE
      </span>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 rounded-full border border-outline-variant text-body-sm font-medium hover:border-primary transition-colors">
          Professional
        </button>
        <button className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary text-primary text-body-sm font-semibold flex items-center gap-1">
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          Friendly
        </button>
        <button className="px-3 py-1.5 rounded-full border border-outline-variant text-body-sm font-medium hover:border-primary transition-colors">
          Direct
        </button>
      </div>
    </div>
  </>
);

interface ComposerActionsProps {
  onSend: () => void;
  disabled: boolean;
  isSent: boolean;
}

const ComposerActions = ({ onSend, disabled, isSent }: ComposerActionsProps) => (
  <div className="p-4 border-t border-outline-variant bg-surface-container-low/30 flex justify-between items-center shrink-0 rounded-b-xl">
    <button className="px-4 py-2 border border-primary text-primary font-semibold rounded-lg flex items-center gap-2 hover:bg-primary/5 active:scale-95 transition-all">
      <span className="material-symbols-outlined text-[20px]">refresh</span>
      Regenerate
    </button>
    <button
      onClick={onSend}
      disabled={disabled}
      className="px-8 py-2 bg-primary text-on-primary font-semibold rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[20px]">send</span>
      {isSent ? "Sent" : "Send Now"}
    </button>
  </div>
);

// --- MAIN OUTREACH AREA ---
function Outreach() {
  const dispatch = useAppDispatch();
  const gmailConnected = useAppSelector((state) => state.app.integrations.gmail);
  const leadsState = useAppSelector((state) => state.app.leads);

  const outreachLeads = useMemo(
    () =>
      leadsState.filter((lead) =>
        ["Qualified", "Drafted", "Sent", "Replied"].includes(lead.status),
      ),
    [leadsState],
  );

  const [selectedId, setSelectedId] = useState(outreachLeads[0]?.id ?? "");
  const selectedLead = outreachLeads.find((lead) => lead.id === selectedId) ?? outreachLeads[0];

  const [subject, setSubject] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // --- UNDO / REDO STATE MANAGEMENT ---
  const [body, setBodyState] = useState("");
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  // Custom function to handle state updates explicitly
  const updateBody = (nextBody: string) => {
    setPast((prev) => [...prev, body]);
    setBodyState(nextBody);
    setFuture([]); // Clear redo timeline on new input additions
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture((prev) => [body, ...prev]);
    setPast(newPast);
    setBodyState(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prev) => [...prev, body]);
    setFuture(newFuture);
    setBodyState(next);
  };

  // Keyboard Shortcuts Bindings (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo(); // Command + Shift + Z on MacOS platforms
        } else {
          handleUndo();
        }
      } else if (modifier && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo(); // Ctrl + Y on Windows/Linux platforms
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [body, past, future]);

  // Sync composer fields cleanly when leads mutate
  useEffect(() => {
    if (selectedLead) {
      setSubject(`A faster sales handoff for ${selectedLead.company}`);
      const initialTemplate = `Hi ${selectedLead.name.split(" ")[0]},\n\nI noticed ${selectedLead.company} is investing in its sales motion. Teams at this stage often lose valuable context between prospecting, discovery calls, and proposal creation.\n\nSalesSync AI carries that context across the entire funnel, helping teams qualify faster and draft source-grounded proposals without rebuilding the story from scratch.\n\nWould you be open to a 15-minute conversation next week?\n\nBest,\nAlex`;

      setBodyState(initialTemplate);
      setPast([]); // Flush history stack for unique leads
      setFuture([]);
    } else {
      setSubject("Personalized outreach");
      setBodyState("");
      setPast([]);
      setFuture([]);
    }
  }, [selectedLead]);

  const handleSend = () => {
    if (selectedLead) {
      dispatch(sendEmail(selectedLead.id));
      setIsExpanded(false);
    }
  };

  return (
    <>
      <TopBar title="Outreach" />
      <div className="page-shell flex h-[calc(100vh-64px)] flex-col overflow-hidden p-6 gap-4">
        {!gmailConnected && (
          <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 shrink-0">
            <span>
              Connect Gmail in Settings to send production emails. Drafting remains available.
            </span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 shrink-0">
          {[
            { label: "EMAILS SENT", value: "1,284", delta: "+12%", color: "text-primary" },
            { label: "OPENED RATE", value: "42.5%", delta: "+5%", color: "text-tertiary" },
            { label: "REPLIED", value: "8.2%", delta: "+2.4%", color: "text-primary" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col"
            >
              <span className="font-label-caps text-label-caps text-on-surface-variant">
                {s.label}
              </span>
              <div className="flex items-end gap-2 mt-1">
                <span className="font-display-lg text-display-lg text-on-surface">{s.value}</span>
                <span className={`${s.color} font-semibold text-body-sm mb-1`}>{s.delta}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Sidebar Area */}
          <div className="w-[35%] bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center shrink-0">
              <h3 className="font-headline-md text-body-base font-bold">Priority Leads</h3>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">
                filter_list
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {outreachLeads.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  className={`flex items-center gap-3 p-4 border-l-4 transition-colors cursor-pointer border-b border-outline-variant/50 ${
                    l.id === selectedLead?.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-surface-container"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center font-bold shrink-0 ${
                      l.id === selectedLead?.id
                        ? "bg-secondary-container text-primary"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {l.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-body-base font-semibold truncate">{l.name}</h4>
                    <p className="text-body-sm text-on-surface-variant truncate">
                      {l.title} @ {l.company}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-[10px] font-bold rounded uppercase shrink-0 ${
                      l.status === "Replied"
                        ? "bg-green-50 text-green-700"
                        : l.status === "Sent"
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Inline Email Composer */}
          <div className="w-[65%] bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h3 className="font-headline-md text-body-base font-bold">Email Composer</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
                  title="Expand Composer"
                >
                  <span className="material-symbols-outlined text-[20px] block">open_in_full</span>
                </button>
                <button className="px-3 py-1 text-body-sm font-semibold border border-outline-variant rounded hover:bg-surface-container transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  Later
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              <ComposerContent
                email={selectedLead?.email ?? ""}
                subject={subject}
                setSubject={setSubject}
                body={body}
                updateBody={updateBody}
                canUndo={past.length > 0}
                canRedo={future.length > 0}
                onUndo={handleUndo}
                onRedo={handleRedo}
              />
            </div>

            <ComposerActions
              onSend={handleSend}
              disabled={!selectedLead}
              isSent={selectedLead?.status === "Sent"}
            />
          </div>
        </div>
      </div>

      {/* Expanded Modal Overlay Window */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-fade-in">
          <div className="w-full max-w-4xl h-[85vh] bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h3 className="text-body-base font-bold">
                  Email Composer{" "}
                  <span className="text-on-surface-variant font-normal text-sm">
                    — Editing Draft
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
                  title="Collapse Window"
                >
                  <span className="material-symbols-outlined text-[20px] block">
                    close_fullscreen
                  </span>
                </button>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar bg-surface-container-lowest">
              <ComposerContent
                email={selectedLead?.email ?? ""}
                subject={subject}
                setSubject={setSubject}
                body={body}
                updateBody={updateBody}
                canUndo={past.length > 0}
                canRedo={future.length > 0}
                onUndo={handleUndo}
                onRedo={handleRedo}
              />
            </div>

            <ComposerActions
              onSend={handleSend}
              disabled={!selectedLead}
              isSent={selectedLead?.status === "Sent"}
            />
          </div>
        </div>
      )}
    </>
  );
}
