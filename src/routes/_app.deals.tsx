import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import {
  api,
  OpportunityApi,
  OpportunityPayload,
  OpportunityStage,
  OpportunitySummaryApi,
} from "../lib/api";
import { useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/deals")({
  head: () => ({
    meta: [
      { title: "Deals · SalesSync AI" },
      {
        name: "description",
        content: "Manage opportunities, pipeline value and revenue outcomes.",
      },
    ],
  }),
  component: DealsPage,
});

const stages: { name: OpportunityStage; color: string; probability: number }[] = [
  { name: "Prospecting", color: "bg-slate-400", probability: 10 },
  { name: "Qualification", color: "bg-amber-500", probability: 30 },
  { name: "Proposal", color: "bg-blue-500", probability: 60 },
  { name: "Negotiation", color: "bg-violet-500", probability: 80 },
  { name: "Closed Won", color: "bg-emerald-500", probability: 100 },
  { name: "Closed Lost", color: "bg-rose-500", probability: 0 },
];

const emptyForm: OpportunityPayload = {
  name: "",
  company_name: "",
  stage: "Prospecting",
  amount: 0,
  currency: "USD",
  probability: 10,
  expected_close_date: "",
  owner_id: null,
  lead_id: null,
  notes: "",
  loss_reason: "",
};

function money(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function DealsPage() {
  const accessToken = useAppSelector((state) => state.app.auth.accessToken);
  const team = useAppSelector((state) => state.app.team);
  const leads = useAppSelector((state) => state.app.leads);
  const [deals, setDeals] = useState<OpportunityApi[]>([]);
  const [summary, setSummary] = useState<OpportunitySummaryApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"board" | "list">("board");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OpportunityApi | null>(null);
  const [form, setForm] = useState<OpportunityPayload>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !team.id) return;
    setLoading(true);
    setError("");
    try {
      const [records, totals] = await Promise.all([
        api.getOpportunities(accessToken, team.id),
        api.getOpportunitySummary(accessToken, team.id),
      ]);
      setDeals(records.data);
      setSummary(totals.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load opportunities");
    } finally {
      setLoading(false);
    }
  }, [accessToken, team.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? deals.filter((deal) =>
          `${deal.name} ${deal.company_name} ${deal.owner_name || ""}`.toLowerCase().includes(term),
        )
      : deals;
  }, [deals, query]);

  function openCreate(stage: OpportunityStage = "Prospecting") {
    const preset = stages.find((item) => item.name === stage)!;
    setEditing(null);
    setForm({ ...emptyForm, stage, probability: preset.probability });
    setModalOpen(true);
  }

  function openEdit(deal: OpportunityApi) {
    setEditing(deal);
    setForm({
      name: deal.name,
      company_name: deal.company_name,
      stage: deal.stage,
      amount: Number(deal.amount),
      currency: deal.currency,
      probability: deal.probability,
      expected_close_date: deal.expected_close_date || "",
      owner_id: deal.owner_id,
      lead_id: deal.lead_id,
      notes: deal.notes || "",
      loss_reason: deal.loss_reason || "",
    });
    setModalOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !team.id) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        expected_close_date: form.expected_close_date || null,
        loss_reason: form.stage === "Closed Lost" ? form.loss_reason || null : null,
      };
      if (editing) await api.updateOpportunity(editing.id, payload, accessToken, team.id);
      else await api.createOpportunity(payload, accessToken, team.id);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save opportunity");
    } finally {
      setSaving(false);
    }
  }

  async function moveDeal(deal: OpportunityApi, stage: OpportunityStage) {
    if (!accessToken || !team.id || deal.stage === stage) return;
    const probability = stages.find((item) => item.name === stage)!.probability;
    try {
      await api.updateOpportunity(deal.id, { stage, probability }, accessToken, team.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move opportunity");
    }
  }

  async function remove() {
    if (!editing || !accessToken || !team.id || !window.confirm(`Delete ${editing.name}?`)) return;
    setSaving(true);
    try {
      await api.deleteOpportunity(editing.id, accessToken, team.id);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete opportunity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title="Deals" />
      <div className="page-shell space-y-5">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-heading">Revenue pipeline</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.035em] text-slate-900">
              Opportunities
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Track every qualified deal from discovery through close.
            </p>
          </div>
          <button onClick={() => openCreate()} className="primary-action">
            <span className="material-symbols-outlined text-[17px]">add</span>New opportunity
          </button>
        </section>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            <span>{error}</span>
            <button onClick={() => setError("")}>
              <span className="material-symbols-outlined text-[17px]">close</span>
            </button>
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            [
              "Open pipeline",
              money(summary?.pipeline_value || 0),
              `${summary?.open_count || 0} active opportunities`,
              "account_tree",
              "text-cyan-700 bg-cyan-50",
            ],
            [
              "Weighted forecast",
              money(summary?.weighted_value || 0),
              "Probability adjusted",
              "monitoring",
              "text-violet-700 bg-violet-50",
            ],
            [
              "Closed won",
              money(summary?.won_value || 0),
              `${summary?.won_count || 0} won deals`,
              "trophy",
              "text-emerald-700 bg-emerald-50",
            ],
            [
              "Win rate",
              summary && summary.won_count + summary.lost_count
                ? `${Math.round((summary.won_count / (summary.won_count + summary.lost_count)) * 100)}%`
                : "0%",
              `${summary?.lost_count || 0} lost deals`,
              "percent",
              "text-amber-700 bg-amber-50",
            ],
          ].map(([label, value, detail, icon, tone]) => (
            <div key={label} className="metric-card p-4">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </div>
              <p className="text-xl font-black tracking-tight text-slate-900">{value}</p>
              <p className="mt-0.5 text-[11px] font-bold text-slate-700">{label}</p>
              <p className="mt-1 text-[9px] text-slate-400">{detail}</p>
            </div>
          ))}
        </section>

        <section className="section-panel">
          <div className="section-header flex-row items-center">
            <label className="control flex min-h-0 w-full max-w-sm items-center gap-2 px-3 py-2">
              <span className="material-symbols-outlined text-[17px] text-slate-400">search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-xs outline-none"
                placeholder="Search deals, companies, owners..."
              />
            </label>
            <div className="flex rounded-lg border border-outline-variant/60 bg-slate-50 p-1">
              {(["board", "list"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setView(item)}
                  className={`flex h-8 items-center gap-1 rounded-md px-2.5 text-[10px] font-bold capitalize ${view === item ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {item === "board" ? "view_kanban" : "view_list"}
                  </span>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                progress_activity
              </span>
              <p>Loading pipeline...</p>
            </div>
          ) : view === "board" ? (
            <div className="custom-scrollbar overflow-x-auto bg-slate-50/60 p-4">
              <div className="flex min-w-max gap-3">
                {stages.map((stage) => {
                  const items = filtered.filter((deal) => deal.stage === stage.name);
                  const value = items.reduce((sum, deal) => sum + Number(deal.amount), 0);
                  return (
                    <div
                      key={stage.name}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const deal = deals.find(
                          (item) => item.id === e.dataTransfer.getData("deal-id"),
                        );
                        if (deal) void moveDeal(deal, stage.name);
                      }}
                      className="kanban-column w-[250px] p-2.5"
                    >
                      <div className="mb-2 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                            {stage.name}
                          </span>
                          <span className="rounded-full bg-white px-1.5 text-[9px] font-bold text-slate-400">
                            {items.length}
                          </span>
                        </div>
                        <button
                          onClick={() => openCreate(stage.name)}
                          className="text-slate-400 hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[17px]">add</span>
                        </button>
                      </div>
                      <p className="mb-2 px-1 text-[9px] font-semibold text-slate-400">
                        {money(value)}
                      </p>
                      <div className="space-y-2">
                        {items.map((deal) => (
                          <button
                            key={deal.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("deal-id", deal.id)}
                            onClick={() => openEdit(deal)}
                            className="kanban-card block w-full p-3 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[11px] font-bold text-slate-800">{deal.name}</p>
                              <span className="rounded bg-primary/8 px-1.5 py-0.5 text-[8px] font-black text-primary">
                                {deal.probability}%
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-500">{deal.company_name}</p>
                            <p className="mt-3 text-sm font-black text-slate-900">
                              {money(deal.amount, deal.currency)}
                            </p>
                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[8px] text-slate-400">
                              <span>{deal.owner_name || "Unassigned"}</span>
                              <span>{deal.expected_close_date || "No close date"}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    {["Opportunity", "Stage", "Owner", "Value", "Probability", "Close date"].map(
                      (head) => (
                        <th key={head} className="px-5 py-3 text-left">
                          {head}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => openEdit(deal)}
                      className="cursor-pointer border-t border-outline-variant/35"
                    >
                      <td className="px-5 py-3">
                        <p className="text-xs font-bold">{deal.name}</p>
                        <p className="text-[10px] text-slate-400">{deal.company_name}</p>
                      </td>
                      <td className="px-5 py-3 text-[10px] font-semibold">{deal.stage}</td>
                      <td className="px-5 py-3 text-[10px] text-slate-500">
                        {deal.owner_name || "Unassigned"}
                      </td>
                      <td className="px-5 py-3 text-xs font-black">
                        {money(deal.amount, deal.currency)}
                      </td>
                      <td className="px-5 py-3 text-[10px]">{deal.probability}%</td>
                      <td className="px-5 py-3 text-[10px] text-slate-500">
                        {deal.expected_close_date || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <form onSubmit={save} className="modal-surface max-w-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="section-heading">
                  {editing ? "Edit opportunity" : "Create opportunity"}
                </p>
                <h2 className="mt-1 text-lg font-black">
                  {editing ? editing.name : "Add a deal to the pipeline"}
                </h2>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="icon-button">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Field label="Opportunity name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="control w-full px-3 text-sm outline-none"
                  placeholder="Enterprise rollout"
                />
              </Field>
              <Field label="Company">
                <input
                  required
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="control w-full px-3 text-sm outline-none"
                  placeholder="Acme Corporation"
                />
              </Field>
              <Field label="Stage">
                <select
                  value={form.stage}
                  onChange={(e) => {
                    const stage = e.target.value as OpportunityStage;
                    setForm({
                      ...form,
                      stage,
                      probability: stages.find((item) => item.name === stage)!.probability,
                    });
                  }}
                  className="control w-full px-3 text-sm outline-none"
                >
                  {stages.map((stage) => (
                    <option key={stage.name}>{stage.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Owner">
                <select
                  value={form.owner_id || ""}
                  onChange={(e) => setForm({ ...form, owner_id: e.target.value || null })}
                  className="control w-full px-3 text-sm outline-none"
                >
                  <option value="">Assign to me</option>
                  {team.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Deal value">
                <div className="control flex overflow-hidden">
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="border-r border-slate-200 bg-slate-50 px-2 text-xs font-bold outline-none"
                  >
                    <option>USD</option>
                    <option>PKR</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="min-w-0 flex-1 px-3 text-sm outline-none"
                  />
                </div>
              </Field>
              <Field label="Probability">
                <div className="control flex items-center gap-3 px-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.probability}
                    onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                    className="flex-1 accent-[#087f8c]"
                  />
                  <span className="w-9 text-right text-xs font-black">{form.probability}%</span>
                </div>
              </Field>
              <Field label="Expected close">
                <input
                  type="date"
                  value={form.expected_close_date || ""}
                  onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                  className="control w-full px-3 text-sm outline-none"
                />
              </Field>
              <Field label="Linked lead">
                <select
                  value={form.lead_id || ""}
                  onChange={(e) => {
                    const lead = leads.find((item) => item.id === e.target.value);
                    setForm({
                      ...form,
                      lead_id: e.target.value || null,
                      company_name: form.company_name || lead?.company || "",
                    });
                  }}
                  className="control w-full px-3 text-sm outline-none"
                >
                  <option value="">No linked lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} · {lead.company}
                    </option>
                  ))}
                </select>
              </Field>
              {form.stage === "Closed Lost" && (
                <div className="sm:col-span-2">
                  <Field label="Loss reason">
                    <input
                      required
                      value={form.loss_reason || ""}
                      onChange={(e) => setForm({ ...form, loss_reason: e.target.value })}
                      className="control w-full px-3 text-sm outline-none"
                      placeholder="Budget, timing, competitor..."
                    />
                  </Field>
                </div>
              )}
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <textarea
                    value={form.notes || ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="control w-full px-3 py-2 text-sm outline-none"
                    rows={3}
                    placeholder="Decision process, next step, commercial context..."
                  />
                </Field>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-6 py-4">
              {editing ? (
                <button
                  type="button"
                  onClick={remove}
                  disabled={saving}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Delete opportunity
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="secondary-action"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="primary-action">
                  {saving ? "Saving..." : editing ? "Save changes" : "Create opportunity"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
