import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { TopBar } from "../components/TopBar";
import { ICPBoard } from "../components/ICPBoard";
import { fetchOnboardingStatus } from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { Skeleton, SkeletonKPIGrid } from "../components/ui/skeleton";
import { isEmptyParsedICP, parseICP } from "../lib/icpParser";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · SalesSync AI" },
      { name: "description", content: "Sales funnel pipeline, KPIs and live AI agent activity." },
      { property: "og:title", content: "Dashboard · SalesSync AI" },
      {
        property: "og:description",
        content: "Sales funnel pipeline, KPIs and live AI agent activity.",
      },
    ],
  }),
  component: Index,
});

// Legacy mock data is retained only for the design reference; the screen renders liveColumns.
const columns = [
  {
    title: "Scraped",
    count: 12,
    accent: "bg-slate-400",
    items: [
      { co: "Acme Corp", who: "John Doe · CEO", score: 78 },
      { co: "Global Tech", who: "Sarah Wu · CTO", score: 72 },
    ],
  },
  {
    title: "Qualified",
    count: 8,
    accent: "bg-amber-500",
    items: [{ co: "Nebula Systems", who: "Mike Ross · VP Sales", score: 93 }],
  },
  {
    title: "Contacted",
    count: 15,
    accent: "bg-cyan-500",
    items: [
      { co: "Stripe-X Inc", who: "Harvey Specter · Partner", score: 91 },
      { co: "Linear Labs", who: "Donna Paulsen · COO", score: 87 },
    ],
  },
  {
    title: "Meeting",
    count: 4,
    accent: "bg-violet-500",
    items: [{ co: "Vercel Future", who: "Guillermo Rauch · CEO", score: 95 }],
  },
  {
    title: "Proposal",
    count: 2,
    accent: "bg-blue-500",
    items: [{ co: "Cloudflare Ops", who: "Matthew Prince · CEO", score: 96 }],
  },
  {
    title: "Closed",
    count: 28,
    accent: "bg-emerald-500",
    items: [{ co: "NextJS Pros", who: "Lee Robinson · DevRel", score: 98 }],
  },
];

const activity = [
  {
    dot: "bg-primary animate-pulse",
    text: (
      <>
        AI Agent <span className="font-bold">Prospecting Bot</span> found 12 new ICP-matched leads.
      </>
    ),
    time: "2 mins ago",
  },
  {
    dot: "bg-violet-500",
    text: (
      <>
        Email sequence <span className="font-bold">SaaS Outreach v2</span> delivered to 48
        recipients.
      </>
    ),
    time: "1 hour ago",
  },
  {
    dot: "bg-amber-500",
    text: (
      <>
        Meeting confirmed with <span className="font-bold">Acme Corp</span> for tomorrow at 10 AM.
      </>
    ),
    time: "3 hours ago",
  },
  {
    dot: "bg-emerald-500",
    text: (
      <>
        Proposal <span className="font-bold">Enterprise Pilot</span> was viewed by Northstar Cloud.
      </>
    ),
    time: "5 hours ago",
  },
];

function formatRelativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Index() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const onboarding = useAppSelector((state) => state.app.onboarding);
  const auth = useAppSelector((state) => state.app.auth);
  const team = useAppSelector((state) => state.app.team);
  const parsedIcp = useMemo(() => parseICP(onboarding.icp), [onboarding.icp]);
  const hasStructuredIcp = parsedIcp !== null && !isEmptyParsedICP(parsedIcp);

  useEffect(() => {
    if (team.id) dispatch(fetchOnboardingStatus());
    // Runs once on mount so the ICP board is always current, whether you
    // arrived here from the Full editor page, after a chat-driven update,
    // or a fresh page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const leads = useAppSelector((state) => state.app.leads);
  const leadsStatus = useAppSelector((state) => state.app.leadsStatus);
  const meetings = useAppSelector((state) => state.app.meetings);
  const meetingsStatus = useAppSelector((state) => state.app.meetingsStatus);
  const proposals = useAppSelector((state) => state.app.proposals);
  const proposalsStatus = useAppSelector((state) => state.app.proposalsStatus);
  const profile = useAppSelector((state) => state.app.profile);

  useEffect(() => {
    if (auth.userTeamsStatus !== "succeeded") return;
    if (!team.id && auth.userTeams.length === 0) {
      void navigate({ to: "/team-setup" });
    }
  }, [auth.userTeamsStatus, auth.userTeams.length, team.id, navigate]);
  const liveColumns = useMemo(
    () => [
      {
        title: "Prospects",
        accent: "bg-slate-400",
        items: leads.filter((lead) => ["New", "Analyzed"].includes(lead.status)).slice(0, 5),
      },
      {
        title: "Qualified",
        accent: "bg-amber-500",
        items: leads.filter((lead) => lead.status === "Qualified").slice(0, 5),
      },
      {
        title: "Outreach",
        accent: "bg-cyan-500",
        items: leads
          .filter((lead) => ["Drafted", "Sent", "Replied"].includes(lead.status))
          .slice(0, 5),
      },
      {
        title: "Meetings",
        accent: "bg-violet-500",
        items: meetings.slice(0, 5).map((meeting) => ({
          id: meeting.id,
          company: meeting.company || "Meeting",
          name: meeting.client || meeting.date,
          title: `${meeting.date} at ${meeting.time}`,
          score: undefined,
        })),
      },
      {
        title: "Proposals",
        accent: "bg-blue-500",
        items: proposals.slice(0, 5).map((proposal) => ({
          id: proposal.id,
          company: proposal.title,
          name: proposal.outcome,
          title: proposal.status,
          score: undefined,
        })),
      },
    ],
    [leads, meetings, proposals],
  );
  const liveActivity = useMemo(
    () =>
      [
        ...leads.map((lead) => ({
          id: `lead-${lead.id}`,
          dot: "bg-primary",
          text: `${lead.name} at ${lead.company || "an unknown company"} was added as a ${lead.status.toLowerCase()} lead.`,
          time: lead.createdAt,
        })),
        ...meetings.map((meeting) => ({
          id: `meeting-${meeting.id}`,
          dot: "bg-amber-500",
          text: `Meeting with ${meeting.client || meeting.company || "a lead"} is ${meeting.status.toLowerCase()}.`,
          time: meeting.createdAt,
        })),
        ...proposals.map((proposal) => ({
          id: `proposal-${proposal.id}`,
          dot: "bg-emerald-500",
          text: `Proposal ${proposal.title} is ${proposal.status.toLowerCase()}.`,
          time: proposal.updatedAt,
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 6),
    [leads, meetings, proposals],
  );
  const isLoading =
    leadsStatus === "loading" || meetingsStatus === "loading" || proposalsStatus === "loading";
  const liveKpis = [
    {
      icon: "groups",
      label: "Total leads",
      value: leads.length.toString(),
      detail: "Current pipeline",
      iconClass: "bg-cyan-50 text-cyan-700",
    },
    {
      icon: "mail",
      label: "Emails sent",
      value: leads.filter((lead) => ["Sent", "Replied"].includes(lead.status)).length.toString(),
      detail: "Sent or replied",
      iconClass: "bg-violet-50 text-violet-700",
    },
    {
      icon: "event_available",
      label: "Meetings",
      value: meetings.length.toString(),
      detail: "Scheduled records",
      iconClass: "bg-amber-50 text-amber-700",
    },
    {
      icon: "description",
      label: "Proposals",
      value: proposals.length.toString(),
      detail: "Current records",
      iconClass: "bg-emerald-50 text-emerald-700",
    },
  ];
  const maxKpiValue = Math.max(...liveKpis.map((item) => Number(item.value) || 0), 1);

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="page-shell space-y-5 sm:space-y-6">
        <section className="subtle-grid relative overflow-hidden rounded-2xl border border-white/8 bg-[#0d2935] px-5 py-5 text-white shadow-xl shadow-slate-900/10 sm:px-7 sm:py-6">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/18 to-transparent" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <img
                  src="/logo-white.png"
                  alt="SalesSync AI"
                  className="h-9 w-auto object-contain"
                />

                <span className="text-[10px] mt-1 font-bold uppercase tracking-[0.2em] text-[#83e9eb]">
                  AI sales command center
                </span>
              </div>
              <h1 className="max-w-2xl text-[22px] font-black tracking-[-0.035em] sm:text-[27px]">
                Hi{profile.name ? ` ${profile.name.split(" ")[0]}` : ""}. Your pipeline is moving.
              </h1>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                to="/lead-generation"
                className="inline-flex items-center gap-2 rounded-lg bg-white/8 px-4 py-2.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/14 transition hover:bg-white/13"
              >
                <span className="material-symbols-outlined text-[18px]">person_search</span>
                Find leads
              </Link>
              <Link
                to="/proposals"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-[#16a3a9]"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Draft proposal
              </Link>
            </div>
          </div>
        </section>

        <section className="section-panel p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              <p className="text-sm font-bold text-on-surface">Ideal Customer Profile</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link to="/onboarding" className="secondary-action">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit ICP
              </Link>
            </div>
          </div>

          {hasStructuredIcp && parsedIcp ? (
            <ICPBoard icp={parsedIcp} />
          ) : onboarding.icp.trim() ? (
            <p className="whitespace-pre-line rounded-lg border border-outline-variant/50 bg-surface-container-low/30 p-3 text-xs leading-relaxed text-on-surface-variant">
              {onboarding.icp}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant/60 bg-white/50 px-3 py-8 text-center">
              <span className="material-symbols-outlined text-[22px] text-outline">tune</span>
              <p className="text-xs font-semibold text-slate-400">
                No ICP yet — describe your ideal customer to get started.
              </p>
            </div>
          )}
        </section>

        {isLoading ? (
          <SkeletonKPIGrid />
        ) : (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {liveKpis.map((k) => (
              <div key={k.label} className="metric-card p-4 sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center ">
                    <span
                      className={`material-symbols-outlined text-[20px] p-2 rounded-xl leading-none ${k.iconClass}`}
                    >
                      {k.icon}
                    </span>
                  </span>

                  <span className="hidden rounded-full bg-surface-container/70 px-2 py-1 text-[9px] font-bold text-on-surface-variant sm:inline-flex">
                    {k.detail}
                  </span>
                </div>
                <p className="text-[25px] font-black tracking-[-0.04em] text-on-surface sm:text-[29px]">
                  {k.value}
                </p>
                <h3 className="mt-0.5 text-[11px] font-semibold text-on-surface-variant sm:text-xs">
                  {k.label}
                </h3>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container-low">
                  <div
                    className="h-full min-w-1 rounded-full bg-primary/70 transition-[width] duration-500"
                    style={{
                      width: `${Math.max(5, ((Number(k.value) || 0) / maxKpiValue) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="section-panel">
          <div className="section-header flex-row items-center">
            <div>
              <h2 className="text-[17px] font-extrabold tracking-tight text-on-surface">
                Sales pipeline
              </h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Opportunities moving through your AI-assisted funnel
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button className="icon-button border border-outline-variant/60 bg-white">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
              </button>
              <button className="primary-action px-3 sm:px-4">
                <span className="material-symbols-outlined text-[17px]">add</span>
                <span className="hidden sm:inline">Add lead</span>
              </button>
            </div>
          </div>
          <div className="custom-scrollbar overflow-x-auto bg-surface-container-low/20 p-3 sm:p-4">
            <div className="flex min-w-max gap-3 xl:min-w-0">
              {liveColumns.map((col) => (
                <div
                  key={col.title}
                  className="kanban-column w-[220px] flex-shrink-0 p-2.5 xl:min-w-[190px] xl:flex-1"
                >
                  <div className="mb-2 flex items-center justify-between px-1 py-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                        {col.title}
                      </span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                        {col.items.length}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[15px] text-outline">
                      more_horiz
                    </span>
                  </div>
                  <div className="space-y-2">
                    {col.items.map((item) => (
                      <div key={item.id} className="kanban-card cursor-pointer p-3">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-600">
                            {item.company
                              .split(" ")
                              .map((word) => word[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          {item.score != null && (
                            <span className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                              {item.score}% fit
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] font-bold text-on-surface">{item.company}</p>
                        <p className="mt-0.5 truncate text-[10px] text-on-surface-variant">
                          {item.name} {item.title ? `- ${item.title}` : ""}
                        </p>
                      </div>
                    ))}
                    {col.items.length === 0 && (
                      <div className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant/60 bg-white/50 px-3 text-center">
                        <span className="material-symbols-outlined text-[20px] text-outline">
                          inbox
                        </span>
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          No opportunities
                        </p>
                      </div>
                    )}
                    <button className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold text-slate-400 transition hover:bg-white hover:text-primary">
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      Add opportunity
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="app-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-outline-variant/50 px-5 py-4">
              <div>
                <h2 className="text-[17px] font-extrabold tracking-tight">Recent activity</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Live updates from your agents and pipeline
                </p>
              </div>
              <button className="text-xs font-bold text-primary hover:underline">View all</button>
            </div>
            <div className="divide-y divide-outline-variant/40">
              {liveActivity.length ? (
                liveActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-primary/[0.025]"
                  >
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                      <div className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] leading-relaxed text-on-surface">{item.text}</p>
                    </div>
                    <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">
                      {formatRelativeTime(item.time)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-5 py-8 text-center text-sm text-on-surface-variant">
                  No pipeline activity yet.
                </p>
              )}
            </div>
          </div>

          <div className="app-card relative overflow-hidden bg-gradient-to-br from-[#102b38] to-[#123e49] p-5 text-white">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/35 blur-3xl" />
            <div className="relative">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <span className="material-symbols-outlined text-[#72e1e3]">insights</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#72e1e3]">
                AI pipeline insight
              </p>
              <h3 className="mt-2 text-lg font-extrabold leading-snug">
                Your strongest conversion opportunity is in qualification.
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                Three leads scored above 85% but have not entered outreach. Drafting personalized
                messages could improve this week’s meeting rate.
              </p>
              <Link
                to="/qualification"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#102b38] shadow-lg transition hover:translate-x-0.5"
              >
                Review high-fit leads
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}