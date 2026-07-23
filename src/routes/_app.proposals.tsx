import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { type Proposal, updateProposalOutcome, updateProposalStatus } from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Skeleton } from "../components/ui/skeleton";
import {
  fetchProposals,
  updateProposalOutcomeRemote,
  updateProposalStatusRemote,
  uploadProposalTemplate,
} from "../store/apiThunks";
import type { ProposalTemplateApi } from "../lib/api";
import { api } from "../lib/api";

export const Route = createFileRoute("/_app/proposals")({
  head: () => ({
    meta: [
      { title: "Proposals · SalesSync AI" },
      {
        name: "description",
        content: "Track and view AI-generated proposal documents.",
      },
    ],
  }),
  component: Proposals,
});

function Proposals() {
  const dispatch = useAppDispatch();
  const proposals = useAppSelector((state) => state.app.proposals);
  const proposalsStatus = useAppSelector((state) => state.app.proposalsStatus);

  const [template, setTemplate] = useState<ProposalTemplateApi | null>(null);
  const accessToken = useAppSelector(
    (state) => state.app.auth.accessToken ?? localStorage.getItem("access_token"),
  );
  const teamId = useAppSelector((state) => state.app.team.id);

  useEffect(() => {
    dispatch(fetchProposals());
  }, [dispatch]);

  useEffect(() => {
    if (!accessToken || !teamId) return;
    api
      .getProposalTemplate(accessToken, teamId)
      .then((res) => setTemplate(res.data ?? null))
      .catch(() => {});
  }, [accessToken, teamId]);

  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateUploading, setTemplateUploading] = useState(false);
  const templateFileRef = useRef<HTMLInputElement>(null);

  const handleTemplateUpload = async () => {
    if (!templateFile || !templateName.trim()) return;
    setTemplateUploading(true);
    try {
      const res = await dispatch(
        uploadProposalTemplate({ file: templateFile, template_name: templateName.trim() }),
      ).unwrap();
      setTemplate(res);
      setShowTemplateUpload(false);
      setTemplateName("");
      setTemplateFile(null);
    } catch {
      // handled by thunk
    } finally {
      setTemplateUploading(false);
    }
  };

  const handleTemplateDelete = async () => {
    if (!accessToken) return;
    try {
      await api.deleteProposalTemplate(accessToken, teamId);
      setTemplate(null);
    } catch {
      // ignore
    }
  };

  const [search, setSearch] = useState("");

  const filteredProposals = useMemo(() => {
    const query = search.toLowerCase();
    return proposals.filter((proposal) =>
      [proposal.title, proposal.summary, proposal.status, proposal.outcome ?? "Open"]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [proposals, search]);

  return (
    <>
      <TopBar title="Proposals" />
      <div className="page-shell">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="relative max-w-md flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="control w-full py-2 pl-10 pr-4 text-body-base outline-none"
              placeholder="Search proposals..."
              type="text"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Open" value={proposals.filter((p) => getOutcome(p) === "Open").length} />
            <Metric label="Won" value={proposals.filter((p) => getOutcome(p) === "Won").length} />
            <Metric label="Lost" value={proposals.filter((p) => getOutcome(p) === "Lost").length} />
          </div>
        </div>

        <section className="section-panel mb-6 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">Proposal template</h2>
              <p className="text-sm text-on-surface-variant">
                Upload a branded .doc/.docx template used as the base for generated proposals.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {template && template.presigned_url && (
                <a
                  href={template.presigned_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary-action"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  View
                </a>
              )}
              <button onClick={() => setShowTemplateUpload(true)} className="primary-action">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                {template ? "Replace" : "Upload"}
              </button>
              {template && (
                <button onClick={handleTemplateDelete} className="secondary-action text-red-600 hover:bg-red-50">
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete
                </button>
              )}
            </div>
          </div>
          {template && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-outline-variant/50 bg-surface-container-low/40 p-3">
              <span className="material-symbols-outlined text-[28px] text-primary">description</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{template.template_name}</p>
                <p className="text-xs text-on-surface-variant">
                  {template.file_size ? `${(template.file_size / 1024).toFixed(0)} KB` : ""}
                  {template.file_type ? ` · ${template.file_type.toUpperCase()}` : ""}
                </p>
              </div>
            </div>
          )}
        </section>

        {proposalsStatus === "loading" ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredProposals.map((proposal) => (
              <div key={proposal.id} className="app-card app-card-hover overflow-hidden p-5 ring-1 ring-primary/10">
                <ProposalHeader proposal={proposal} />
                <div className="mb-5 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/6 to-white p-5">
                  <h4 className="mb-3 font-label-caps text-label-caps uppercase tracking-wider text-primary">
                    Executive Summary
                  </h4>
                  <p className="text-body-base leading-relaxed text-on-surface-variant">
                    {proposal.summary}
                  </p>
                </div>
                <div className="mb-5 grid gap-4 md:grid-cols-[1fr_260px]">
                  <div className="overflow-hidden rounded-2xl border border-outline-variant/70 bg-white p-5">
                    <p className="text-sm text-on-surface-variant">
                      Version <strong>{proposal.version}</strong>
                      {proposal.fileSize ? ` · ${(proposal.fileSize / 1024).toFixed(0)} KB` : ""}
                    </p>
                  </div>
                  <OutcomePanel proposal={proposal} />
                </div>
                <ProposalActions proposal={proposal} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showTemplateUpload && (
        <div
          className="modal-backdrop"
          onClick={() => !templateUploading && setShowTemplateUpload(false)}
        >
          <div className="modal-surface max-w-md p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-5 text-lg font-bold">
              {template ? "Replace template" : "Upload template"}
            </h3>

            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              File (.doc or .docx only)
            </label>
            <input
              ref={templateFileRef}
              type="file"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setTemplateFile(e.target.files?.[0] ?? null)}
              className="control mb-4 w-full p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
            />

            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Template name
            </label>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="control mb-5 w-full px-3 py-2 text-sm outline-none"
              placeholder="e.g. Branded Proposal 2026"
            />

            <div className="flex justify-end gap-3">
              <button
                disabled={templateUploading}
                onClick={() => setShowTemplateUpload(false)}
                className="secondary-action"
              >
                Cancel
              </button>
              <button
                disabled={templateUploading || !templateFile || !templateName.trim()}
                onClick={handleTemplateUpload}
                className="primary-action disabled:opacity-50"
              >
                {templateUploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading…
                  </>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getOutcome(proposal: Proposal) {
  return proposal.outcome ?? "Open";
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card px-4 py-2">
      <p className="text-lg font-black text-on-surface">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
    </div>
  );
}

function ProposalHeader({ proposal }: { proposal: Proposal }) {
  const outcome = getOutcome(proposal);
  const editedDate = useMemo(() => {
    try {
      const d = new Date(proposal.updatedAt);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return proposal.updatedAt;
    }
  }, [proposal.updatedAt]);

  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="font-headline-md text-headline-md">
            {proposal.title}
          </h3>
          <Badge label={proposal.status} />
          <Badge
            label={outcome}
            tone={outcome === "Won" ? "success" : outcome === "Lost" ? "danger" : "neutral"}
          />
        </div>
      </div>
      <p className="shrink-0 text-right text-[11px] text-on-surface-variant">
        Last edited
        <br />
        <span className="font-semibold">{editedDate}</span>
      </p>
    </div>
  );
}

function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const classes =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "danger"
        ? "bg-red-100 text-red-700"
        : "bg-surface-container-high text-on-surface-variant";

  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${classes}`}>
      {label}
    </span>
  );
}

function OutcomePanel({ proposal }: { proposal: Proposal }) {
  const dispatch = useAppDispatch();
  const accessToken =
    useAppSelector((state) => state.app.auth.accessToken) ?? localStorage.getItem("access_token");
  const outcome = getOutcome(proposal);

  return (
    <div
      className="rounded-xl border border-outline-variant bg-surface-container-low/40 p-4"
    >
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
        Deal outcome
      </p>
      <div className="grid grid-cols-3 gap-2">
        {(["Open", "Won", "Lost"] as const).map((option) => (
          <button
            key={option}
            onClick={() => {
              if (accessToken) {
                dispatch(updateProposalOutcomeRemote({ id: proposal.id, outcome: option }));
              } else {
                dispatch(updateProposalOutcome({ id: proposal.id, outcome: option }));
              }
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
              outcome === option
                ? option === "Won"
                  ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                  : option === "Lost"
                    ? "border-red-300 bg-red-100 text-red-800"
                    : "border-primary/30 bg-primary/10 text-primary"
                : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProposalActions({ proposal }: { proposal: Proposal }) {
  const dispatch = useAppDispatch();
  const accessToken =
    useAppSelector((state) => state.app.auth.accessToken) ?? localStorage.getItem("access_token");

  return (
    <div className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-5">
      {proposal.presignedUrl && (
        <a
          href={proposal.presignedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[19px]">visibility</span>
          View Document
        </a>
      )}
      <button
        onClick={() => {
          if (accessToken) {
            dispatch(updateProposalStatusRemote({ id: proposal.id, status: "Sent" }));
          } else {
            dispatch(updateProposalStatus({ id: proposal.id, status: "Sent" }));
          }
        }}
        className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
      >
        {proposal.status === "Sent" ? "Sent" : "Send"}
      </button>
    </div>
  );
}
