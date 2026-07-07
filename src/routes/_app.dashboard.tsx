import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "../components/TopBar";
import { useAppSelector } from "../store/hooks";
import { Skeleton, SkeletonKPIGrid } from "../components/ui/skeleton";

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

function Index() {
  const onboarding = useAppSelector((state) => state.app.onboarding);
  const leads = useAppSelector((state) => state.app.leads);
  const leadsStatus = useAppSelector((state) => state.app.leadsStatus);
  const meetings = useAppSelector((state) => state.app.meetings);
  const meetingsStatus = useAppSelector((state) => state.app.meetingsStatus);
  const proposals = useAppSelector((state) => state.app.proposals);
  const proposalsStatus = useAppSelector((state) => state.app.proposalsStatus);
  const profile = useAppSelector((state) => state.app.profile);
  const isLoading =
    leadsStatus === "loading" || meetingsStatus === "loading" || proposalsStatus === "loading";
  const liveKpis = [
    {
      icon: "groups",
      label: "Total leads",
      value: leads.length.toString(),
      delta: "+12.5%",
      iconClass: "bg-cyan-50 text-cyan-700",
    },
    {
      icon: "mail",
      label: "Emails sent",
      value: leads.filter((lead) => ["Sent", "Replied"].includes(lead.status)).length.toString(),
      delta: "+4.2%",
      iconClass: "bg-violet-50 text-violet-700",
    },
    {
      icon: "event_available",
      label: "Meetings",
      value: meetings.length.toString(),
      delta: "+8%",
      iconClass: "bg-amber-50 text-amber-700",
    },
    {
      icon: "description",
      label: "Proposals",
      value: proposals.length.toString(),
      delta: "+18%",
      iconClass: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="page-shell space-y-6">
        <section className="relative overflow-hidden rounded-[1.35rem] bg-[#0d2935] px-6 py-5 text-white shadow-xl shadow-slate-900/10">
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-primary/35 blur-3xl" />
          <div className="absolute bottom-[-80px] right-40 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <img
                  src="/logo-white.png"
                  alt="SalesSync AI"
                  className="h-10 w-auto rounded-xl object-contain"
                />

                <span className="text-[10px] mt-1 font-bold uppercase tracking-[0.2em] text-[#83e9eb]">
                  AI sales command center
                </span>
              </div>
              <h1 className="text-[24px] font-black tracking-tight">
                Hi{profile.name ? ` ${profile.name.split(" ")[0]}` : ""}. Your pipeline is moving.
              </h1>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                to="/lead-generation"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
              >
                <span className="material-symbols-outlined text-[18px]">person_search</span>
                Find leads
              </Link>
              <Link
                to="/proposals"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#25b9c0] to-primary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/25 transition hover:brightness-110"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Draft proposal
              </Link>
            </div>
          </div>
        </section>

        {!onboarding.completed && (
          <section className="app-card flex flex-col justify-between gap-4 border-l-4 border-l-primary p-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined">tune</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Finish your workspace setup</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Confirm your product and target customer so lead scores use the right ICP.
                </p>
              </div>
            </div>
            <Link
              to="/onboarding"
              className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-primary/20"
            >
              Generate ICP
            </Link>
          </section>
        )}

        {isLoading ? (
          <SkeletonKPIGrid />
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {liveKpis.map((k) => (
              <div key={k.label} className="app-card app-card-hover relative overflow-hidden p-4">
                <div className="mb-5 flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center ">
                    <span
                      className={`material-symbols-outlined text-[20px] p-2 rounded-xl leading-none ${k.iconClass}`}
                    >
                      {k.icon}
                    </span>
                  </span>

                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                    <span className="material-symbols-outlined text-[12px]">north_east</span>
                    {k.delta}
                  </span>
                </div>
                <p className="text-[26px] font-black tracking-tight text-on-surface">{k.value}</p>
                <h3 className="mt-1 text-xs font-semibold text-on-surface-variant">{k.label}</h3>
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary/60 via-primary/15 to-transparent" />
              </div>
            ))}
          </section>
        )}

        <section className="app-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant/50 px-5 py-4">
            <div>
              <h2 className="text-[17px] font-extrabold tracking-tight text-on-surface">
                Sales pipeline
              </h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Opportunities moving through your AI-assisted funnel
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="icon-button border border-outline-variant/60 bg-white">
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-[#102b38] px-4 py-2.5 text-xs font-semibold text-white shadow-md">
                <span className="material-symbols-outlined text-[17px]">add</span>
                Add lead
              </button>
            </div>
          </div>
          <div className="custom-scrollbar overflow-x-auto bg-slate-50/50 p-4">
            <div className="flex gap-3">
              {columns.map((col) => (
                <div
                  key={col.title}
                  className="w-[205px] flex-shrink-0 rounded-xl border border-outline-variant/45 bg-white/50 p-2"
                >
                  <div className="mb-2 flex items-center justify-between px-1 py-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                        {col.title}
                      </span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                        {col.count}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[15px] text-outline">
                      more_horiz
                    </span>
                  </div>
                  <div className="space-y-2">
                    {col.items.map((item) => (
                      <div
                        key={item.co}
                        className="cursor-pointer rounded-xl border border-outline-variant/50 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-600">
                            {item.co
                              .split(" ")
                              .map((word) => word[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                            {item.score}% fit
                          </span>
                        </div>
                        <p className="text-[12px] font-bold text-on-surface">{item.co}</p>
                        <p className="mt-0.5 truncate text-[10px] text-on-surface-variant">
                          {item.who}
                        </p>
                      </div>
                    ))}
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
              {activity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-primary/[0.025]"
                >
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                    <div className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] leading-relaxed text-on-surface">{item.text}</p>
                  </div>
                  <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">
                    {item.time}
                  </span>
                </div>
              ))}
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
