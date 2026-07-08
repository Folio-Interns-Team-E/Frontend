import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import {
  reviseProposal,
  type Proposal,
  type ProposalTemplate,
  resetProposalTemplate,
  updateProposalTemplate,
  updateProposalOutcome,
  updateProposalStatus,
} from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Skeleton, SkeletonKPIGrid } from "../components/ui/skeleton";
import {
  fetchProposals,
  reviseProposalRemote,
  updateProposalOutcomeRemote,
  updateProposalStatusRemote,
} from "../store/apiThunks";

export const Route = createFileRoute("/_app/proposals")({
  head: () => ({
    meta: [
      { title: "Proposals · SalesSync AI" },
      {
        name: "description",
        content: "Draft, preview, revise, and track deal outcomes for AI-generated proposals.",
      },
    ],
  }),
  component: Proposals,
});

type ProposalDraft = {
  id: string;
  title: string;
  summary: string;
  value: string;
  note: string;
};

function Proposals() {
  const dispatch = useAppDispatch();
  const proposals = useAppSelector((state) => state.app.proposals);
  const proposalsStatus = useAppSelector((state) => state.app.proposalsStatus);
  const profile = useAppSelector((state) => state.app.profile);
  const proposalTemplate = useAppSelector((state) => state.app.proposalTemplate);
  const accessToken = useAppSelector((state) => state.app.auth.accessToken);

  useEffect(() => {
    if (proposalsStatus === "idle") dispatch(fetchProposals());
  }, [proposalsStatus, dispatch]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProposalDraft | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredProposals = useMemo(() => {
    const query = search.toLowerCase();
    return proposals.filter((proposal) =>
      [
        proposal.company,
        proposal.title,
        proposal.summary,
        proposal.status,
        proposal.outcome ?? "Open",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [proposals, search]);

  const featured = filteredProposals[0];
  const preview = proposals.find((proposal) => proposal.id === previewId);
  const history = proposals.find((proposal) => proposal.id === historyId);

  function openEditor(proposal: Proposal) {
    setEditing({
      id: proposal.id,
      title: proposal.title,
      summary: proposal.summary,
      value: proposal.value,
      note: "",
    });
  }

  function saveRevision(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    if (accessToken) {
      dispatch(reviseProposalRemote(editing));
    } else {
      dispatch(reviseProposal(editing));
    }
    setEditing(null);
  }

  return (
    <>
      <TopBar title="Proposals" />
      <div className="page-shell">
        <TemplatePanel template={proposalTemplate} defaultCompanyName={profile.company} />

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative max-w-md flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-white py-2 pl-10 pr-4 text-body-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Search proposals, outcomes, or client..."
              type="text"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric
              label="Open"
              value={proposals.filter((proposal) => getOutcome(proposal) === "Open").length}
            />
            <Metric
              label="Won"
              value={proposals.filter((proposal) => getOutcome(proposal) === "Won").length}
            />
            <Metric
              label="Lost"
              value={proposals.filter((proposal) => getOutcome(proposal) === "Lost").length}
            />
          </div>
        </div>

        {proposalsStatus === "loading" ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {featured && (
              // You can safely remove 'xl:col-span-2' from here now since the track is naturally full-width
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
                  <div className="overflow-hidden rounded-2xl border border-outline-variant/70 bg-white">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-surface-container-low">
                        <tr>
                          {["Service Tier", "Features", "Investment"].map((heading) => (
                            <th
                              key={heading}
                              className="p-3 text-[11px] font-bold uppercase text-on-surface-variant"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-body-sm">
                        <tr className="border-t border-outline-variant">
                          <td className="p-3 font-semibold text-primary">SalesSync Pilot</td>
                          <td className="p-3 text-on-surface-variant">
                            ICP scoring, discovery intelligence, proposal revision workflow
                          </td>
                          <td className="p-3 font-mono font-bold">{featured.value}</td>
                        </tr>
                        <tr className="border-t border-outline-variant">
                          <td className="p-3 font-semibold text-primary">Knowledge grounding</td>
                          <td className="p-3 text-on-surface-variant">
                            Uses transcripts, past proposals, and case studies
                          </td>
                          <td className="p-3 font-mono font-bold">Included</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <OutcomePanel proposal={featured} />
                </div>

                <ProposalActions
                  proposal={featured}
                  onEdit={() => openEditor(featured)}
                  onPreview={() => setPreviewId(featured.id)}
                  onHistory={() => setHistoryId(featured.id)}
                />
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
                <ProposalActions
                  proposal={proposal}
                  compact
                  onEdit={() => openEditor(proposal)}
                  onPreview={() => setPreviewId(proposal.id)}
                  onHistory={() => setHistoryId(proposal.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <PreviewModal
          proposal={preview}
          template={proposalTemplate}
          defaultCompanyName={profile.company}
          onClose={() => setPreviewId(null)}
          onSend={() => {
            if (accessToken) {
              dispatch(updateProposalStatusRemote({ id: preview.id, status: "Sent" }));
            } else {
              dispatch(updateProposalStatus({ id: preview.id, status: "Sent" }));
            }
            setPreviewId(null);
          }}
        />
      )}

      {editing && (
        <EditModal
          draft={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSubmit={saveRevision}
        />
      )}

      {history && <HistoryModal proposal={history} onClose={() => setHistoryId(null)} />}
    </>
  );
}

function TemplatePanel({
  template,
  defaultCompanyName,
}: {
  template: ProposalTemplate;
  defaultCompanyName: string;
}) {
  const dispatch = useAppDispatch();
  const [companyName, setCompanyName] = useState(template.companyName || defaultCompanyName);
  const [templateName, setTemplateName] = useState(template.templateName || "Default proposal");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(template.logoDataUrl);
  const usingGeneric = !template.companyName && !template.logoDataUrl;

  function handleLogoUpload(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function saveTemplate(event: FormEvent) {
    event.preventDefault();
    dispatch(
      updateProposalTemplate({
        companyName,
        templateName,
        logoDataUrl,
        updatedAt: template.updatedAt,
      }),
    );
  }

  return (
    <section className="mb-6 grid gap-5 rounded-[1.35rem] border border-primary/20 bg-gradient-to-br from-white to-primary/[0.035] p-5 shadow-sm lg:grid-cols-[1fr_300px]">
      <div>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
              Proposal branding
            </p>
            <h2 className="mt-1 text-lg font-black">Company template</h2>
            <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
              Upload a company logo and name to brand every proposal preview. If nothing is saved,
              SalesSync AI uses a clean generic template.
            </p>
          </div>
          <Badge label={usingGeneric ? "Generic template" : "Custom template"} />
        </div>

        <form onSubmit={saveTemplate} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm font-semibold">
            Company name
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Acme Inc."
              className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5 font-normal outline-none focus:border-primary"
            />
          </label>
          <label className="text-sm font-semibold">
            Template name
            <input
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="Enterprise proposal"
              className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-2.5 font-normal outline-none focus:border-primary"
            />
          </label>
          <div className="flex items-end gap-2">
            <button className="h-[42px] rounded-lg bg-primary px-5 text-sm font-bold text-white">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setCompanyName(defaultCompanyName);
                setTemplateName("Default proposal");
                setLogoDataUrl(null);
                dispatch(resetProposalTemplate());
              }}
              className="h-[42px] rounded-lg border border-outline-variant px-4 text-sm font-semibold"
            >
              Use generic
            </button>
          </div>
          <label className="md:col-span-3">
            <span className="text-sm font-semibold">Company logo</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(event) => handleLogoUpload(event.target.files?.[0])}
              className="mt-2 block w-full rounded-lg border border-dashed border-outline-variant bg-surface-container-low/40 px-4 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
            />
          </label>
        </form>
      </div>

      <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low/40 p-4">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
          Preview
        </p>
        <ProposalBrandHeader
          template={{ companyName, templateName, logoDataUrl, updatedAt: template.updatedAt }}
          defaultCompanyName={defaultCompanyName}
        />
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Proposal for Client
          </p>
          <p className="mt-2 text-lg font-black">AI Sales Automation Pilot</p>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            This is how the proposal header will look before sending or exporting.
          </p>
        </div>
      </div>
    </section>
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

function ProposalBrandHeader({
  template,
  defaultCompanyName,
}: {
  template: ProposalTemplate;
  defaultCompanyName: string;
}) {
  const companyName = template.companyName || defaultCompanyName || "SalesSync AI";
  const templateName = template.templateName || "Generic proposal template";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-white p-4">
      {template.logoDataUrl ? (
        <img
          src={template.logoDataUrl}
          alt={`${companyName} logo`}
          className="h-12 w-12 rounded-xl object-contain ring-1 ring-outline-variant"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d1f2d] to-primary text-sm font-black text-white">
          {companyName
            .split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
      )}
      <div>
        <p className="text-sm font-black">{companyName}</p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
          {templateName}
        </p>
      </div>
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
            {proposal.company}
          </h3>
          <Badge label={proposal.status} />
          <Badge
            label={outcome}
            tone={outcome === "Won" ? "success" : outcome === "Lost" ? "danger" : "neutral"}
          />
        </div>
        <p className="text-sm text-on-surface-variant">{proposal.title}</p>
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
  const accessToken = useAppSelector((state) => state.app.auth.accessToken);
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

function ProposalActions({
  proposal,
  compact = false,
  onEdit,
  onPreview,
  onHistory,
}: {
  proposal: Proposal;
  compact?: boolean;
  onEdit: () => void;
  onPreview: () => void;
  onHistory: () => void;
}) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.app.auth.accessToken);

  return (
    <div className={`mt-5 flex flex-wrap justify-end gap-2 ${compact ? "" : "border-t pt-5"}`}>
      <button
        onClick={onEdit}
        className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
      >
        Edit
      </button>
      <button
        onClick={onHistory}
        className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface"
      >
        History ({proposal.revisions?.length ?? 0})
      </button>
      <button
        onClick={onPreview}
        className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
      >
        Preview
      </button>
      <button
        onClick={() => {
          if (accessToken) {
            dispatch(updateProposalStatusRemote({ id: proposal.id, status: "Sent" }));
          } else {
            dispatch(updateProposalStatus({ id: proposal.id, status: "Sent" }));
          }
        }}
        className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        {proposal.status === "Sent" ? "Sent" : "Send"}
      </button>
    </div>
  );
}

function PreviewModal({
  proposal,
  template,
  defaultCompanyName,
  onClose,
  onSend,
}: {
  proposal: Proposal;
  template: ProposalTemplate;
  defaultCompanyName: string;
  onClose: () => void;
  onSend: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-5 border-b border-outline-variant px-7 py-5">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Proposal preview
            </p>
            <h2 className="text-xl font-black">{proposal.company}</h2>
          </div>
          <div className="hidden min-w-[260px] md:block">
            <ProposalBrandHeader template={template} defaultCompanyName={defaultCompanyName} />
          </div>
          <button
            onClick={onClose}
            className="material-symbols-outlined rounded-full p-2 hover:bg-surface-container"
          >
            close
          </button>
        </div>
        <div className="space-y-7 p-8">
          <div className="md:hidden">
            <ProposalBrandHeader template={template} defaultCompanyName={defaultCompanyName} />
          </div>
          <div>
            <h1 className="text-3xl font-black">{proposal.title}</h1>
            <p className="mt-3 text-on-surface-variant">{proposal.summary}</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-5">
            <h3 className="font-bold">Recommended engagement</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              A phased implementation covering ICP-based lead qualification, discovery intelligence,
              and grounded proposal generation.
            </p>
            <p className="mt-4 text-2xl font-black text-primary">{proposal.value}</p>
          </div>
          <div>
            <h3 className="mb-3 font-bold">Sources used</h3>
            <div className="space-y-2">
              {proposal.sources.map((source) => (
                <div key={source} className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-[18px] text-green-700">
                    verified
                  </span>
                  {source}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-outline-variant px-7 py-4">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-semibold"
          >
            <span className="material-symbols-outlined text-[19px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            onClick={onSend}
            className="rounded-lg bg-primary px-5 py-2 font-semibold text-white"
          >
            Send proposal
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  draft,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: ProposalDraft;
  onChange: (draft: ProposalDraft) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant px-7 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Edit proposal
            </p>
            <h2 className="text-xl font-black">Save a new revision</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="material-symbols-outlined rounded-full p-2 hover:bg-surface-container"
          >
            close
          </button>
        </div>
        <div className="grid gap-5 p-7">
          <label className="text-sm font-semibold">
            Proposal title
            <input
              value={draft.title}
              onChange={(event) => onChange({ ...draft, title: event.target.value })}
              className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 font-normal outline-none focus:border-primary"
              required
            />
          </label>
          <label className="text-sm font-semibold">
            Executive summary
            <textarea
              value={draft.summary}
              onChange={(event) => onChange({ ...draft, summary: event.target.value })}
              className="mt-2 min-h-36 w-full rounded-lg border border-outline-variant px-4 py-3 font-normal outline-none focus:border-primary"
              required
            />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-semibold">
              Proposal value
              <input
                value={draft.value}
                onChange={(event) => onChange({ ...draft, value: event.target.value })}
                className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 font-normal outline-none focus:border-primary"
                required
              />
            </label>
            <label className="text-sm font-semibold">
              Revision note
              <input
                value={draft.note}
                onChange={(event) => onChange({ ...draft, note: event.target.value })}
                placeholder="Example: Updated scope after pricing call"
                className="mt-2 w-full rounded-lg border border-outline-variant px-4 py-3 font-normal outline-none focus:border-primary"
              />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-outline-variant px-7 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-outline-variant px-4 py-2 font-semibold"
          >
            Cancel
          </button>
          <button className="rounded-lg bg-primary px-5 py-2 font-semibold text-white">
            Save revision
          </button>
        </div>
      </form>
    </div>
  );
}

function HistoryModal({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  const revisions = proposal.revisions ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant px-7 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Revision history
            </p>
            <h2 className="text-xl font-black">{proposal.company}</h2>
          </div>
          <button
            onClick={onClose}
            className="material-symbols-outlined rounded-full p-2 hover:bg-surface-container"
          >
            close
          </button>
        </div>
        <div className="space-y-4 p-7">
          {revisions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">
              No saved revisions yet.
            </div>
          ) : (
            revisions.map((revision, index) => (
              <div key={revision.id} className="rounded-xl border border-outline-variant p-4">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">{revision.title}</p>
                    <p className="text-xs text-on-surface-variant">
                      {revision.editedAt} by {revision.editedBy}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                    v{revisions.length - index}
                  </span>
                </div>
                <p className="text-sm leading-6 text-on-surface-variant">{revision.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-surface-container-low px-2 py-1 font-mono font-bold">
                    {revision.value}
                  </span>
                  <span className="rounded-lg bg-surface-container-low px-2 py-1">
                    {revision.note}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
