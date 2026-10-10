import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { api, AdminOverview, AuditEventApi, WorkspaceApiKey } from "../lib/api";
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
  const [auditEvents, setAuditEvents] = useState<AuditEventApi[]>([]);
  const [auditCursor, setAuditCursor] = useState<string | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<WorkspaceApiKey[]>([]);
  const [keyName, setKeyName] = useState("");
  const [keyDays, setKeyDays] = useState(90);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !team.id || team.currentUserRole !== "admin") {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.getAdminOverview(token, team.id),
      api.getAuditEvents(token, team.id),
      api.getWorkspaceApiKeys(token, team.id),
    ])
      .then(([overview, audit, keys]) => {
        setData(overview.data);
        setAuditEvents(audit.data.events);
        setAuditCursor(audit.data.next_cursor);
        setApiKeys(keys.data);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Could not load admin data"),
      )
      .finally(() => setLoading(false));
  }, [token, team.id, team.currentUserRole]);

  if (team.currentUserRole !== "admin") {
    return (
      <>
        <TopBar title="Admin overview" />
        <div className="page-shell">
          <div className="section-panel p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-error">lock</span>
            <h1 className="mt-3 text-xl font-bold">Administrator access required</h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Only workspace administrators can view operational and billing data.
            </p>
            <Link to="/dashboard" className="primary-action mt-5 inline-flex">
              Return to dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (loading)
    return (
      <>
        <TopBar title="Admin overview" />
        <div className="page-shell grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </>
    );
  if (!data)
    return (
      <>
        <TopBar title="Admin overview" />
        <div className="page-shell">
          <div className="section-panel p-8 text-center text-error">
            {error || "Admin data is unavailable."}
          </div>
        </div>
      </>
    );

  const cards = [
    [
      "groups",
      "Team members",
      data.members.total,
      `${data.members.by_role.admin ?? 0} admins · ${data.members.by_role.manager ?? 0} managers`,
    ],
    [
      "person_search",
      "Total leads",
      data.pipeline.total_leads,
      `${data.pipeline.qualification_rate}% qualification rate`,
    ],
    ["send", "Emails sent", data.outreach.sent, `${data.outreach.drafts} drafts waiting`],
    [
      "event_available",
      "Meetings",
      data.meetings.total,
      `${data.meetings.by_status.Completed ?? 0} completed`,
    ],
    ["description", "Proposals", data.proposals.total, `${data.proposals.win_rate}% win rate`],
    [
      "database",
      "Knowledge assets",
      data.knowledge_base.total,
      `${data.knowledge_base.by_status.indexed ?? 0} indexed`,
    ],
  ] as const;
  const pipeline = ["New", "Analyzed", "Qualified", "Drafted", "Sent", "Replied", "Converted"];
  const maxStage = Math.max(1, ...pipeline.map((stage) => data.pipeline.by_status[stage] ?? 0));
  const loadMoreAudit = async () => {
    if (!token || !team.id || !auditCursor || loadingAudit) return;
    setLoadingAudit(true);
    try {
      const response = await api.getAuditEvents(token, team.id, auditCursor);
      setAuditEvents((current) => [...current, ...response.data.events]);
      setAuditCursor(response.data.next_cursor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load more audit events");
    } finally {
      setLoadingAudit(false);
    }
  };
  const downloadExport = async (resource: "leads" | "contacts" | "opportunities" | "audit") => {
    if (!token || !team.id || exporting) return;
    setExporting(resource);
    setError("");
    try {
      const { blob, filename } = await api.downloadWorkspaceExport(resource, token, team.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      const refreshed = await api.getAuditEvents(token, team.id);
      setAuditEvents(refreshed.data.events);
      setAuditCursor(refreshed.data.next_cursor);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not export workspace data");
    } finally {
      setExporting(null);
    }
  };
  const createApiKey = async () => {
    if (!token || !team.id || !keyName.trim() || savingKey) return;
    setSavingKey(true);
    setError("");
    try {
      const response = await api.createWorkspaceApiKey(keyName.trim(), keyDays, token, team.id);
      setApiKeys((current) => [response.data.api_key, ...current]);
      setNewSecret(response.data.key);
      setKeyName("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create API key");
    } finally {
      setSavingKey(false);
    }
  };
  const revokeApiKey = async (key: WorkspaceApiKey) => {
    if (
      !token ||
      !team.id ||
      key.revoked_at ||
      !window.confirm(
        `Revoke API key “${key.name}”? Existing integrations using it will stop working.`,
      )
    )
      return;
    try {
      await api.revokeWorkspaceApiKey(key.id, token, team.id);
      setApiKeys((current) =>
        current.map((item) =>
          item.id === key.id ? { ...item, revoked_at: new Date().toISOString() } : item,
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not revoke API key");
    }
  };

  return (
    <>
      <TopBar title="Admin overview" />
      <div className="page-shell space-y-5">
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} className="font-bold">
              Dismiss
            </button>
          </div>
        )}
        <section className="overflow-hidden rounded-2xl bg-[#0d2935] p-6 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#72e1e3]">
                Workspace control center
              </p>
              <h1 className="mt-2 text-2xl font-black">{data.workspace.name}</h1>
              <p className="mt-2 text-sm text-slate-300">
                Operational health, team access, integrations and revenue pipeline in one view.
              </p>
            </div>
            <div className="flex gap-2">
              <Status label="ICP" good={data.workspace.icp_configured} />
              <Status
                label="Billing"
                good={data.billing.status === "active" || data.billing.status === "trialing"}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([icon, label, value, detail]) => (
            <div key={label} className="section-panel p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-black">{value}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{detail}</p>
                </div>
                <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2.5 text-primary">
                  {icon}
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="section-panel p-5">
            <h2 className="text-lg font-bold">Pipeline distribution</h2>
            <p className="text-sm text-on-surface-variant">
              Lead volume and movement across each sales stage
            </p>
            <div className="mt-5 space-y-3">
              {pipeline.map((stage) => {
                const count = data.pipeline.by_status[stage] ?? 0;
                return (
                  <div key={stage} className="grid grid-cols-[80px_1fr_36px] items-center gap-3">
                    <span className="text-xs font-semibold">{stage}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                        style={{ width: `${(count / maxStage) * 100}%` }}
                      />
                    </div>
                    <span className="text-right text-xs font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 border-t border-outline-variant pt-4 text-sm">
              <span className="text-on-surface-variant">Average ICP score</span>
              <span className="float-right font-bold">{data.pipeline.average_score}/100</span>
            </div>
          </div>

          <div className="section-panel p-5">
            <h2 className="text-lg font-bold">System readiness</h2>
            <div className="mt-4 space-y-3">
              <Readiness label="Gmail outreach" good={data.integrations.gmail_connected} />
              <Readiness label="Cal.com scheduling" good={data.integrations.calcom_connected} />
              <Readiness label="Apollo sourcing" good={data.integrations.apollo_connected} />
              <Readiness label="Ideal customer profile" good={data.workspace.icp_configured} />
              <Readiness
                label="Knowledge base"
                good={(data.knowledge_base.by_status.indexed ?? 0) > 0}
              />
            </div>
            {data.integrations.apollo_connected && (
              <div className="mt-5 rounded-xl bg-surface-container p-4">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Apollo monthly usage</span>
                  <span>
                    {data.integrations.apollo_used}/{data.integrations.apollo_limit}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(100, data.integrations.apollo_limit ? (data.integrations.apollo_used / data.integrations.apollo_limit) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <Link
              to="/settings"
              className="secondary-action mt-5 inline-flex w-full justify-center"
            >
              Manage integrations
            </Link>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.45fr]">
          <div className="section-panel overflow-hidden">
            <div className="border-b border-outline-variant p-5">
              <h2 className="text-lg font-bold">Recent workspace activity</h2>
            </div>
            <div className="divide-y divide-outline-variant">
              {data.recent_activity.length ? (
                data.recent_activity.map((item, index) => (
                  <div
                    key={`${item.type}-${index}`}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <span className="material-symbols-outlined rounded-lg bg-surface-container p-2 text-primary">
                      {activityIcon[item.type]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-on-surface-variant">{item.detail}</p>
                    </div>
                    <time className="text-xs text-on-surface-variant">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                ))
              ) : (
                <p className="p-8 text-center text-sm text-on-surface-variant">No activity yet.</p>
              )}
            </div>
          </div>
          <div className="section-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Subscription
            </p>
            <p className="mt-2 text-2xl font-black capitalize">{data.billing.tier}</p>
            <p className="mt-1 text-sm capitalize text-on-surface-variant">{data.billing.status}</p>
            {data.billing.renews_or_ends_at && (
              <p className="mt-3 text-xs text-on-surface-variant">
                Period ends {new Date(data.billing.renews_or_ends_at).toLocaleDateString()}
              </p>
            )}
            <Link to="/billing" className="primary-action mt-5 inline-flex w-full justify-center">
              Manage billing
            </Link>
            <Link to="/team" className="secondary-action mt-2 inline-flex w-full justify-center">
              Manage team access
            </Link>
          </div>
        </section>

        <section className="section-panel p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Data export center</h2>
              <p className="text-sm text-on-surface-variant">
                Download a tenant-scoped CSV backup for reporting or migration. Every export is
                audited.
              </p>
            </div>
            <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2.5 text-primary">
              download
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["leads", "Leads", "person_search"],
                ["contacts", "Contacts", "contacts"],
                ["opportunities", "Deals", "paid"],
                ["audit", "Audit trail", "policy"],
              ] as const
            ).map(([resource, label, icon]) => (
              <button
                key={resource}
                type="button"
                disabled={Boolean(exporting)}
                onClick={() => void downloadExport(resource)}
                className="flex items-center gap-3 rounded-xl border border-outline-variant p-4 text-left transition hover:border-primary hover:bg-primary/5 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-primary">
                  {exporting === resource ? "progress_activity" : icon}
                </span>
                <span>
                  <span className="block text-sm font-bold">
                    {exporting === resource ? "Preparing…" : label}
                  </span>
                  <span className="text-xs text-on-surface-variant">CSV export</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="section-panel overflow-hidden">
          <div className="border-b border-outline-variant p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Workspace API keys</h2>
                <p className="text-sm text-on-surface-variant">
                  Authenticate server-to-server automations with the{" "}
                  <code className="font-mono">X-API-Key</code> header.
                </p>
              </div>
              <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2.5 text-primary">
                key
              </span>
            </div>
            {newSecret && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold text-amber-900">
                  Copy this key now. It will never be shown again.
                </p>
                <div className="mt-2 flex gap-2">
                  <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 text-xs">
                    {newSecret}
                  </code>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => void navigator.clipboard.writeText(newSecret)}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setNewSecret(null)}
                    aria-label="Hide API key"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px_auto]">
              <input
                className="control"
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
                maxLength={100}
                placeholder="Key name, e.g. CRM sync"
              />
              <select
                className="control"
                value={keyDays}
                onChange={(event) => setKeyDays(Number(event.target.value))}
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
              <button
                type="button"
                className="primary-action"
                disabled={!keyName.trim() || savingKey}
                onClick={() => void createApiKey()}
              >
                {savingKey ? "Creating…" : "Create key"}
              </button>
            </div>
          </div>
          <div className="divide-y divide-outline-variant">
            {apiKeys.length ? (
              apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{key.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${key.revoked_at ? "bg-slate-100 text-slate-500" : new Date(key.expires_at) <= new Date() ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {key.revoked_at
                          ? "Revoked"
                          : new Date(key.expires_at) <= new Date()
                            ? "Expired"
                            : "Active"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-on-surface-variant">
                      {key.key_prefix}••••••••
                    </p>
                    <p className="mt-1 text-[10px] text-on-surface-variant">
                      Expires {new Date(key.expires_at).toLocaleDateString()} · Last used{" "}
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "Never"}
                    </p>
                  </div>
                  {!key.revoked_at && (
                    <button
                      type="button"
                      className="secondary-action text-red-600"
                      onClick={() => void revokeApiKey(key)}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-sm text-on-surface-variant">
                No API keys have been created.
              </p>
            )}
          </div>
        </section>

        <section className="section-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant p-5">
            <div>
              <h2 className="text-lg font-bold">Workspace audit trail</h2>
              <p className="text-sm text-on-surface-variant">
                Administrative and automation changes recorded for security review
              </p>
            </div>
            <span className="material-symbols-outlined rounded-xl bg-primary/10 p-2.5 text-primary">
              policy
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {auditEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-surface-container/50">
                    <td className="px-5 py-3.5 font-semibold">
                      {event.action.replaceAll(".", " ")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="capitalize">{event.target_type.replaceAll("_", " ")}</span>
                      {event.target_id && (
                        <span className="ml-2 font-mono text-xs text-on-surface-variant">
                          {event.target_id.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-on-surface-variant">
                      {event.actor_user_id?.slice(0, 8) ?? "System"}
                    </td>
                    <td className="px-5 py-3.5 text-on-surface-variant">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!auditEvents.length && (
              <p className="p-8 text-center text-sm text-on-surface-variant">
                No audited changes have been recorded yet.
              </p>
            )}
          </div>
          {auditCursor && (
            <div className="border-t border-outline-variant p-4 text-center">
              <button
                type="button"
                className="secondary-action"
                disabled={loadingAudit}
                onClick={loadMoreAudit}
              >
                {loadingAudit ? "Loading…" : "Load older events"}
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Status({ label, good }: { label: string; good: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-bold ${good ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}
    >
      {label}: {good ? "Ready" : "Needs setup"}
    </span>
  );
}
function Readiness({ label, good }: { label: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-outline-variant px-3 py-2.5">
      <span className="text-sm font-semibold">{label}</span>
      <span
        className={`material-symbols-outlined text-xl ${good ? "text-emerald-600" : "text-amber-500"}`}
      >
        {good ? "check_circle" : "warning"}
      </span>
    </div>
  );
}
