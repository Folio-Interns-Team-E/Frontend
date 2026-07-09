import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import {
  type Proposal,
  updateProposalOutcome,
  updateProposalStatus,
} from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Skeleton } from "../components/ui/skeleton";
import { fetchProposals, uploadProposalTemplate } from "../store/apiThunks";
import type { ProposalTemplateApi } from "../lib/api";

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

  useEffect(() => {
    if (proposalsStatus === "idle") dispatch(fetchProposals());
  }, [proposalsStatus, dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("/api/proposals/template", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => setTemplate(res.data ?? null))
      .catch(() => {});
  }, []);

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

  const featured = filteredProposals[0];

  return (
    <>
      <TopBar title="Proposals" />
      <div className="page-shell">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative max-w-md flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-white py-2 pl-10 pr-4 text-body-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Search proposals..."
              type="text"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric
              label="Open"
              value={proposals.filter((p) => getOutcome(p) === "Open").length}
            />
            <Metric
              label="Won"
              value={proposals.filter((p) => getOutcome(p) === "Won").length}
            />
            <Metric
              label="Lost"
              value={proposals.filter((p) => getOutcome(p) === "Lost").length}
            />
          </div>
        </div>

        <section className="rounded-xl border border-outline-variant bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">Proposal template</h2>
              <p className="text-sm text-on-surface-variant">
                Upload a branded .docx template used as the base for generated proposals.
              </p>
            </div>
            {template && template.presignedUrl && (
              <a
                href={template.presignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                View template
              </a>
            )}
            <button
              onClick={() => setShowTemplateUpload(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              {template ? "Replace" : "Upload"}
            </button>
          </div>
          {template && (
            <div className="mt-3 text-xs text-on-surface-variant">
              <span className="font-semibold">{template.template_name}</span>
              {template.file_size
                ? ` · ${(template.file_size / 1024).toFixed(0)} KB`
                : ""}
              {template.file_type ? ` · ${template.file_type.toUpperCase()}` : ""}
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
            {featured && (
              <div className="app-card app-card-hover overflow-hidden p-5 ring-1 ring-primary/10">
                <ProposalHeader proposal={featured} />
                <div className="mb-5 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/6 to-white p-5">
                  <h4 className="mb-3 font-label-caps text-label-caps uppercase tracking-wider text-primary">
                    Executive Summary
                  </h4>
                  <p className="text-body-base leading-relaxed text-on-surface-variant">
                    {featured.summary}
                  </p>
                </div>
                <div className="mb-5 grid gap-4 md:grid-cols-[1fr_260px]">
                  <div className="overflow-hidden rounded-2xl border border-outline-variant/70 bg-white p-5">
                    <p className="text-sm text-on-surface-variant">
                      Version <strong>{featured.version}</strong>
                      {featured.fileSize
                        ? ` · ${(featured.fileSize / 1024).toFixed(0)} KB`
                        : ""}
                    </p>
                  </div>
                  <OutcomePanel proposal={featured} />
                </div>
                <ProposalActions proposal={featured} />
              </div>
            )}

            {filteredProposals.slice(1).map((proposal) => (
              <div key={proposal.id} className="app-card app-card-hover p-5">
                <ProposalHeader proposal={proposal} compact />
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-on-surface-variant">
                  {proposal.summary}
                </p>
                <div className="mt-5">
                  <OutcomePanel proposal={proposal} compact />
                </div>
                <ProposalActions proposal={proposal} compact />
              </div>
            ))}
          </div>
        )}
      </div>

      {showTemplateUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !templateUploading && setShowTemplateUpload(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 text-lg font-bold">
              {template ? "Replace template" : "Upload template"}
            </h3>

            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              File (.docx or .pdf)
            </label>
            <input
              ref={templateFileRef}
              type="file"
              accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setTemplateFile(e.target.files?.[0] ?? null)}
              className="mb-4 w-full rounded-lg border border-outline-variant p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
            />

            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Template name
            </label>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mb-5 w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="e.g. Branded Proposal 2026"
            />

            <div className="flex justify-end gap-3">
              <button
                disabled={templateUploading}
                onClick={() => setShowTemplateUpload(false)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface"
              >
                Cancel
              </button>
              <button
                disabled={templateUploading || !templateFile || !templateName.trim()}
                onClick={handleTemplateUpload}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
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
    <div className="rounded-xl border border-outline-variant bg-white px-4 py-2 shadow-sm">
      <p className="text-lg font-black text-on-surface">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
    </div>
  );
}

function ProposalHeader({ proposal, compact = false }: { proposal: Proposal; compact?: boolean }) {
  const outcome = getOutcome(proposal);
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className={compact ? "text-[18px] font-black" : "font-headline-md text-headline-md"}>
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
        <span className="font-semibold">{proposal.updatedAt}</span>
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

function OutcomePanel({ proposal, compact = false }: { proposal: Proposal; compact?: boolean }) {
  const dispatch = useAppDispatch();
  const outcome = getOutcome(proposal);

  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface-container-low/40 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
        Deal outcome
      </p>
      <div className="grid grid-cols-3 gap-2">
        {(["Open", "Won", "Lost"] as const).map((option) => (
          <button
            key={option}
            onClick={() => dispatch(updateProposalOutcome({ id: proposal.id, outcome: option }))}
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

function ProposalActions({
  proposal,
  compact = false,
}: {
  proposal: Proposal;
  compact?: boolean;
}) {
  const dispatch = useAppDispatch();

  return (
    <div className={`mt-5 flex flex-wrap justify-end gap-2 ${compact ? "" : "border-t pt-5"}`}>
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
        onClick={() => dispatch(updateProposalStatus({ id: proposal.id, status: "Sent" }))}
        className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
      >
        {proposal.status === "Sent" ? "Sent" : "Send"}
      </button>
    </div>
  );
}
