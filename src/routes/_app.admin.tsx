import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { api, AdminOverview } from "../lib/api";
import { useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin Overview · SalesSync AI" }] }),
  component: AdminDashboard,
});

const activityIcon = { lead: "person_add", meeting: "event", proposal: "description" } as const;

function AdminDashboard() {
  const token = useAppSelector((state) => state.app.auth.accessToken);
  const team = useAppSelector((state) => state.app.team);
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !team.id || team.currentUserRole !== "admin") {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.getAdminOverview(token, team.id)
      .then((response) => setData(response.data))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load admin data"))
      .finally(() => setLoading(false));
  }, [token, team.id, team.currentUserRole]);

  if (team.currentUserRole !== "admin") {
    return <><TopBar title="Admin overview" /><div className="page-shell"><div className="section-panel p-8 text-center"><span className="material-symbols-outlined text-4xl text-error">lock</span><h1 className="mt-3 text-xl font-bold">Administrator access required</h1><p className="mt-2 text-sm text-on-surface-variant">Only workspace administrators can view operational and billing data.</p><Link to="/dashboard" className="primary-action mt-5 inline-flex">Return to dashboard</Link></div></div></>;
  }

  if (loading) return <><TopBar title="Admin overview" /><div className="page-shell grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}</div></>;
  if (error || !data) return <><TopBar title="Admin overview" /><div className="page-shell"><div className="section-panel p-8 text-center text-error">{error || "Admin data is unavailable."}</div></div></>;

  const cards = [
    ["groups", "Team members", data.members.total, `${data.members.by_role.admin ?? 0} admins · ${data.members.by_role.manager ?? 0} managers`],
    ["person_search", "Total leads", data.pipeline.total_leads, `${data.pipeline.qualification_rate}% qualification rate`],
    ["send", "Emails sent", data.outreach.sent, `${data.outreach.drafts} drafts waiting`],
    ["event_available", "Meetings", data.meetings.total, `${data.meetings.by_status.Completed ?? 0} completed`],
    ["description", "Proposals", data.proposals.total, `${data.proposals.win_rate}% win rate`],
    ["database", "Knowledge assets", data.knowledge_base.total, `${data.knowledge_base.by_status.indexed ?? 0} indexed`],
  ] as const;
  const pipeline = ["New", "Analyzed", "Qualified", "Drafted", "Sent", "Replied", "Converted"];
  const maxStage = Math.max(1, ...pipeline.map((stage) => data.pipeline.by_status[stage] ?? 0));

  return (
    <>
      <TopBar title="Admin overview" />
      <div className="page-shell space-y-5">
        <section className="overflow-hidden rounded-2xl bg-[#0d2935] p-6 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#72e1e3]">Workspace control center</p><h1 className="mt-2 text-2xl font-black">{data.workspace.name}</h1><p className="mt-2 text-sm text-slate-300">Operational health, team access, integrations and revenue pipeline in one view.</p></div>
            <div className="flex gap-2"><Status label="ICP" good={data.workspace.icp_configured} /><Status label="Billing" good={data.billing.status === "active" || data.billing.status === "trialing"} /></div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([icon, label, value, detail]) => <div key={label} className="section-panel p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-1 text-xs text-on-surface-variant">{detail}</p></div><span className="material-symbols-outlined rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</span></div></div>)}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="section-panel p-5"><h2 className="text-lg font-bold">Pipeline distribution</h2><p className="text-sm text-on-surface-variant">Lead volume and movement across each sales stage</p><div className="mt-5 space-y-3">{pipeline.map((stage) => { const count = data.pipeline.by_status[stage] ?? 0; return <div key={stage} className="grid grid-cols-[80px_1fr_36px] items-center gap-3"><span className="text-xs font-semibold">{stage}</span><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${(count / maxStage) * 100}%` }} /></div><span className="text-right text-xs font-bold">{count}</span></div>; })}</div><div className="mt-5 border-t border-outline-variant pt-4 text-sm"><span className="text-on-surface-variant">Average ICP score</span><span className="float-right font-bold">{data.pipeline.average_score}/100</span></div></div>

          <div className="section-panel p-5"><h2 className="text-lg font-bold">System readiness</h2><div className="mt-4 space-y-3"><Readiness label="Gmail outreach" good={data.integrations.gmail_connected} /><Readiness label="Cal.com scheduling" good={data.integrations.calcom_connected} /><Readiness label="Apollo sourcing" good={data.integrations.apollo_connected} /><Readiness label="Ideal customer profile" good={data.workspace.icp_configured} /><Readiness label="Knowledge base" good={(data.knowledge_base.by_status.indexed ?? 0) > 0} /></div>{data.integrations.apollo_connected && <div className="mt-5 rounded-xl bg-surface-container p-4"><div className="flex justify-between text-xs font-semibold"><span>Apollo monthly usage</span><span>{data.integrations.apollo_used}/{data.integrations.apollo_limit}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-primary" style={{ width: `${Math.min(100, data.integrations.apollo_limit ? data.integrations.apollo_used / data.integrations.apollo_limit * 100 : 0)}%` }} /></div></div>}<Link to="/settings" className="secondary-action mt-5 inline-flex w-full justify-center">Manage integrations</Link></div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.45fr]">
          <div className="section-panel overflow-hidden"><div className="border-b border-outline-variant p-5"><h2 className="text-lg font-bold">Recent workspace activity</h2></div><div className="divide-y divide-outline-variant">{data.recent_activity.length ? data.recent_activity.map((item, index) => <div key={`${item.type}-${index}`} className="flex items-center gap-3 px-5 py-3.5"><span className="material-symbols-outlined rounded-lg bg-surface-container p-2 text-primary">{activityIcon[item.type]}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.label}</p><p className="text-xs text-on-surface-variant">{item.detail}</p></div><time className="text-xs text-on-surface-variant">{new Date(item.timestamp).toLocaleDateString()}</time></div>) : <p className="p-8 text-center text-sm text-on-surface-variant">No activity yet.</p>}</div></div>
          <div className="section-panel p-5"><p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Subscription</p><p className="mt-2 text-2xl font-black capitalize">{data.billing.tier}</p><p className="mt-1 text-sm capitalize text-on-surface-variant">{data.billing.status}</p>{data.billing.renews_or_ends_at && <p className="mt-3 text-xs text-on-surface-variant">Period ends {new Date(data.billing.renews_or_ends_at).toLocaleDateString()}</p>}<Link to="/billing" className="primary-action mt-5 inline-flex w-full justify-center">Manage billing</Link><Link to="/team" className="secondary-action mt-2 inline-flex w-full justify-center">Manage team access</Link></div>
        </section>
      </div>
    </>
  );
}

function Status({ label, good }: { label: string; good: boolean }) { return <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${good ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>{label}: {good ? "Ready" : "Needs setup"}</span>; }
function Readiness({ label, good }: { label: string; good: boolean }) { return <div className="flex items-center justify-between rounded-xl border border-outline-variant px-3 py-2.5"><span className="text-sm font-semibold">{label}</span><span className={`material-symbols-outlined text-xl ${good ? "text-emerald-600" : "text-amber-500"}`}>{good ? "check_circle" : "warning"}</span></div>; }
