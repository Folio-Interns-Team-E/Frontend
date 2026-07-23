import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Skeleton, SkeletonList } from "../components/ui/skeleton";
import {
  fetchLeads,
  fetchLeadEmails,
  sendEmailRemote,
  deleteEmailRemote,
} from "../store/apiThunks";
import { selectEmail, clearSelectedEmail } from "../store/appSlice";

export const Route = createFileRoute("/_app/outreach")({
  head: () => ({
    meta: [
      { title: "Outreach · SalesSync AI" },
      {
        name: "description",
        content: "AI-drafted email outreach with per-lead context.",
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
  </>
);

interface ComposerActionsProps {
  onSend: () => void;
  disabled: boolean;
  isSent: boolean;
  sentTo: string;
}

const ComposerActions = ({ onSend, disabled, isSent, sentTo }: ComposerActionsProps) => (
  <div className="flex shrink-0 items-center justify-end border-t border-outline-variant/45 bg-surface-container-low/25 p-4">
    <button
      onClick={onSend}
      disabled={disabled}
      className="primary-action min-w-36 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[20px]">send</span>
      {isSent ? `Sent to ${sentTo || "recipient"}` : "Send Now"}
    </button>
  </div>
);

// --- MAIN OUTREACH AREA ---
const OUTREACH_STATUSES = ["Qualified", "Drafted", "Sent", "Replied", "Converted"];

function Outreach() {
  const dispatch = useAppDispatch();
  const gmailConnected = useAppSelector((state) => state.app.integrations.gmail);
  const allLeads = useAppSelector((state) => state.app.leads);
  const leadsStatus = useAppSelector((state) => state.app.leadsStatus);
  const leadDraftEmails = useAppSelector((state) => state.app.leadDraftEmails);
  const leadEmailsLoading = useAppSelector((state) => state.app.leadEmailsLoading);
  const selectedEmailId = useAppSelector((state) => state.app.selectedEmailId);
  const chatRefreshKey = useAppSelector((state) => state.app.chatRefreshKey);

  const outreachLeads = useMemo(
    () => allLeads.filter((l) => OUTREACH_STATUSES.includes(l.status)),
    [allLeads],
  );
  const sentCount = allLeads.filter((lead) => lead.status === "Sent").length;
  const repliedCount = allLeads.filter((lead) => lead.status === "Replied").length;

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  const [selectedId, setSelectedId] = useState("");
  const selectedLead = outreachLeads.find((lead) => lead.id === selectedId) ?? outreachLeads[0];

  useEffect(() => {
    if (!selectedId && outreachLeads.length > 0) {
      setSelectedId(outreachLeads[0].id);
    }
  }, [outreachLeads, selectedId]);

  const leadEmails = useMemo(
    () => (selectedLead?.id ? leadDraftEmails[selectedLead.id] ?? [] : []),
    [selectedLead?.id, leadDraftEmails],
  );
  const selectedEmail = useMemo(
    () => leadEmails.find((e) => e.id === selectedEmailId) ?? null,
    [leadEmails, selectedEmailId],
  );

  const [subject, setSubject] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // --- UNDO / REDO STATE MANAGEMENT ---
  const [body, setBodyState] = useState("");
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const updateBody = (nextBody: string) => {
    setPast((prev) => [...prev, body]);
    setBodyState(nextBody);
    setFuture([]);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (modifier && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [body, past, future]);

  // Fetch emails when selected lead changes or after AI chat responds
  useEffect(() => {
    if (selectedLead?.id) {
      dispatch(clearSelectedEmail());
      dispatch(fetchLeadEmails(selectedLead.id));
    }
  }, [selectedLead?.id, chatRefreshKey, dispatch]);

  // Sync composer fields when selected email changes
  useEffect(() => {
    if (selectedEmail) {
      setSubject(selectedEmail.subject);
      setBodyState(selectedEmail.body);
    } else {
      setSubject("");
      setBodyState("");
    }
    setPast([]);
    setFuture([]);
  }, [selectedEmail?.id]);

  const handleSend = () => {
    if (selectedLead && subject && body) {
      dispatch(sendEmailRemote({ leadId: selectedLead.id, subject, body }));
      setIsExpanded(false);
    }
  };

  const handleDelete = (emailId: string) => {
    if (selectedLead?.id) {
      dispatch(deleteEmailRemote({ emailId, leadId: selectedLead.id }));
    }
  };

  return (
    <>
      <TopBar title="Outreach" />
      <div className="page-shell flex min-h-[calc(100vh-64px)] flex-col gap-4 xl:h-[calc(100vh-64px)] xl:overflow-hidden">
        {!gmailConnected && (
          <div className="flex shrink-0 items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            <span className="material-symbols-outlined text-[19px]">info</span>
            <span>
              Connect Gmail in Settings to send production emails. Drafting remains available.
            </span>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
          {/* Sidebar Area — Leads */}
          {leadsStatus === "loading" ? (
            <div className="section-panel min-h-64 w-full xl:w-[36%]">
              <div className="p-4 border-b border-outline-variant">
                <Skeleton className="h-5 w-24" />
              </div>
              <SkeletonList count={4} />
            </div>
          ) : (
            <div className="section-panel flex min-h-64 w-full flex-col xl:w-[36%]">
              <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/45 p-4">
                <h3 className="font-headline-md text-body-base font-bold">Priority Leads</h3>
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">
                  filter_list
                </span>
              </div>
              <div className="custom-scrollbar max-h-[320px] flex-1 overflow-y-auto xl:max-h-none">
                {outreachLeads.length === 0 ? (
                  <div className="p-6 text-center">
                    <span className="material-symbols-outlined text-3xl text-outline">
                      person_off
                    </span>
                    <p className="mt-2 text-body-sm text-on-surface-variant">
                      No qualified leads yet.
                    </p>
                    <p className="text-[11px] text-outline">
                      Qualify leads from the Lead Generation page.
                    </p>
                  </div>
                ) : (
                  outreachLeads.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => setSelectedId(l.id)}
                      className={`flex items-center gap-3 p-4 border-l-4 transition-colors cursor-pointer border-b border-outline-variant/50 ${
                        l.id === selectedLead?.id
                          ? "border-primary bg-primary/[0.055]"
                          : "border-transparent hover:bg-surface-container-low/60"
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
                  ))
                )}
              </div>
            </div>
          )}

          {/* Right Panel — Drafts list + Composer */}
          <div className="section-panel flex min-h-[520px] w-full flex-col xl:min-h-0 xl:w-[64%]">
            {/* Drafts List */}
            <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/45 p-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h3 className="font-headline-md text-body-base font-bold">
                  Emails {leadEmails.length > 0 && <span className="text-on-surface-variant font-normal text-sm">({leadEmails.length})</span>}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded transition-colors"
                  title="Expand Composer"
                >
                  <span className="material-symbols-outlined text-[20px] block">open_in_full</span>
                </button>
              </div>
            </div>

            {leadEmailsLoading ? (
              <div className="flex flex-1 flex-col gap-3 p-4">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : leadEmails.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-outline">draft</span>
                <p className="mt-2 text-body-sm text-on-surface-variant">No emails yet for this lead.</p>
                <p className="text-[11px] text-outline">Use the AI Chat to draft outreach emails.</p>
              </div>
            ) : (
              <>
                {/* Email tabs */}
                <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-outline-variant/45 px-4 pt-2">
                  {leadEmails.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => dispatch(selectEmail(e.id))}
                      className={`group flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                        e.id === selectedEmailId
                          ? "bg-primary/10 text-primary border-b-2 border-primary"
                          : "text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {e.status.toLowerCase() === "sent" ? "send" : e.status.toLowerCase() === "draft" ? "edit" : "mark_email_read"}
                      </span>
                      <span className="truncate max-w-[120px]">
                        {e.subject || "(no subject)"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        e.status.toLowerCase() === "sent"
                          ? "bg-green-50 text-green-700"
                          : "bg-surface-container text-on-surface-variant"
                      }`}>
                        {e.status}
                      </span>
                      {e.status.toLowerCase() === "draft" && (
                        <span
                          onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}
                          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error cursor-pointer"
                          title="Delete draft"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Composer */}
                <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
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
                  disabled={!selectedLead || selectedEmail?.status.toLowerCase() === "sent"}
                  isSent={selectedEmail?.status.toLowerCase() === "sent"}
                  sentTo={selectedLead?.email ?? ""}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Modal Overlay Window */}
      {isExpanded && (
        <div className="modal-backdrop">
          <div className="modal-surface flex h-[min(85vh,760px)] max-w-4xl flex-col overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h3 className="text-body-base font-bold">
                  Email Composer{" "}
                  <span className="text-on-surface-variant font-normal text-sm">
                    — {selectedEmail?.status.toLowerCase() === "sent" ? "Viewing" : "Editing Draft"}
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

            <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 sm:p-8">
              {leadEmailsLoading ? (
                <div className="flex flex-1 flex-col gap-3 p-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : (
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
              )}
            </div>

            <ComposerActions
              onSend={handleSend}
              disabled={!selectedLead || selectedEmail?.status.toLowerCase() === "sent"}
              isSent={selectedEmail?.status.toLowerCase() === "sent"}
              sentTo={selectedLead?.email ?? ""}
            />
          </div>
        </div>
      )}
    </>
  );
}
