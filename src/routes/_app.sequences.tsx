import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, SequenceApi } from "../lib/api";
import { TopBar } from "../components/TopBar";
import { useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/sequences")({
  component: SequencesPage,
  head: () => ({ meta: [{ title: "Sequences · SalesSync AI" }] }),
});

function SequencesPage() {
  const token = useAppSelector((s) => s.app.auth.accessToken);
  const team = useAppSelector((s) => s.app.team);
  const leads = useAppSelector((s) => s.app.leads);
  const [items, setItems] = useState<SequenceApi[]>([]);
  const [modal, setModal] = useState(false);
  const [enroll, setEnroll] = useState<SequenceApi | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [limit, setLimit] = useState(40);
  const [steps, setSteps] = useState([{ position: 0, delay_days: 0, subject: "", body: "" }]);
  const load = useCallback(async () => {
    if (token && team.id)
      try {
        setItems((await api.getSequences(token, team.id)).data);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load sequences");
      }
  }, [token, team.id]);
  useEffect(() => {
    void load();
  }, [load]);
  async function create(e: FormEvent) {
    e.preventDefault();
    if (!token || !team.id) return;
    try {
      await api.createSequence(
        { name, timezone: "Asia/Karachi", daily_limit: limit, stop_on_reply: true, steps },
        token,
        team.id,
      );
      setModal(false);
      setName("");
      setSteps([{ position: 0, delay_days: 0, subject: "", body: "" }]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create sequence");
    }
  }
  async function status(item: SequenceApi, next: string) {
    if (!token || !team.id) return;
    await api.updateSequenceStatus(item.id, next, token, team.id);
    await load();
  }
  async function enrollLeads() {
    if (!enroll || !token || !team.id) return;
    try {
      await api.enrollSequence(enroll.id, selected, token, team.id);
      setEnroll(null);
      setSelected([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enroll leads");
    }
  }
  return (
    <>
      <TopBar title="Sequences" />
      <div className="page-shell space-y-5">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-heading">Outreach automation</p>
            <h1 className="mt-1 text-2xl font-black">Email sequences</h1>
            <p className="mt-1 text-xs text-slate-500">
              Build consistent multi-step follow-up journeys for qualified leads.
            </p>
          </div>
          <button onClick={() => setModal(true)} className="primary-action">
            <span className="material-symbols-outlined text-[17px]">add</span>New sequence
          </button>
        </section>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
        <section className="grid grid-cols-3 gap-3">
          {[
            ["Total sequences", items.length, "conversion_path"],
            ["Active", items.filter((x) => x.status === "Active").length, "play_circle"],
            ["Enrolled leads", items.reduce((a, x) => a + x.active_enrollments, 0), "group"],
          ].map(([l, v, i]) => (
            <div key={l} className="metric-card p-4">
              <span className="material-symbols-outlined text-primary">{i}</span>
              <p className="mt-2 text-xl font-black">{v}</p>
              <p className="text-[10px] font-bold text-slate-500">{l}</p>
            </div>
          ))}
        </section>
        <section className="section-panel">
          {items.length ? (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <span className="material-symbols-outlined">conversion_path</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black">{item.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${item.status === "Active" ? "bg-emerald-50 text-emerald-700" : item.status === "Paused" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {item.steps.length} steps · {item.active_enrollments} active enrollments ·
                      limit {item.daily_limit}/day
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEnroll(item);
                        setSelected([]);
                      }}
                      className="secondary-action"
                    >
                      Enroll leads
                    </button>
                    <button
                      onClick={() =>
                        void status(item, item.status === "Active" ? "Paused" : "Active")
                      }
                      className="primary-action"
                    >
                      {item.status === "Active" ? "Pause" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="material-symbols-outlined text-4xl text-slate-300">
                conversion_path
              </span>
              <p className="font-bold">No sequences yet</p>
              <p className="text-xs">Create a repeatable follow-up process for your sales team.</p>
            </div>
          )}
        </section>
      </div>
      {modal && (
        <div className="modal-backdrop">
          <form onSubmit={create} className="modal-surface max-w-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="section-heading">Sequence builder</p>
                <h2 className="mt-1 text-lg font-black">New email sequence</h2>
              </div>
              <button type="button" onClick={() => setModal(false)} className="icon-button">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Sequence name
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="control mt-1.5 w-full px-3 text-sm normal-case"
                    placeholder="Pakistan SaaS follow-up"
                  />
                </label>
                <label className="text-[10px] font-bold uppercase text-slate-500">
                  Daily limit
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="control mt-1.5 w-full px-3 text-sm"
                  />
                </label>
              </div>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black">Step {index + 1}</p>
                      <label className="text-[9px] font-bold text-slate-500">
                        Wait{" "}
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={step.delay_days}
                          onChange={(e) =>
                            setSteps(
                              steps.map((x, i) =>
                                i === index ? { ...x, delay_days: Number(e.target.value) } : x,
                              ),
                            )
                          }
                          className="mx-1 w-14 rounded border border-slate-200 px-2 py-1"
                        />{" "}
                        days
                      </label>
                    </div>
                    <input
                      required
                      value={step.subject}
                      onChange={(e) =>
                        setSteps(
                          steps.map((x, i) =>
                            i === index ? { ...x, subject: e.target.value } : x,
                          ),
                        )
                      }
                      className="control w-full px-3 text-sm"
                      placeholder="Email subject"
                    />
                    <textarea
                      required
                      value={step.body}
                      onChange={(e) =>
                        setSteps(
                          steps.map((x, i) => (i === index ? { ...x, body: e.target.value } : x)),
                        )
                      }
                      className="control mt-2 w-full px-3 py-2 text-sm"
                      rows={4}
                      placeholder="Hi {{first_name}}, ..."
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setSteps([
                    ...steps,
                    { position: steps.length, delay_days: 3, subject: "", body: "" },
                  ])
                }
                className="secondary-action"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>Add follow-up step
              </button>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button type="button" onClick={() => setModal(false)} className="secondary-action">
                Cancel
              </button>
              <button className="primary-action">Save draft</button>
            </div>
          </form>
        </div>
      )}
      {enroll && (
        <div className="modal-backdrop">
          <div className="modal-surface max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="section-heading">Enroll leads</p>
                <h2 className="mt-1 text-lg font-black">{enroll.name}</h2>
              </div>
              <button onClick={() => setEnroll(null)} className="icon-button">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="custom-scrollbar max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {leads
                .filter((l) => l.email && l.status !== "Discarded")
                .map((lead) => (
                  <label
                    key={lead.id}
                    className="flex cursor-pointer items-center gap-3 px-6 py-3 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(lead.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, lead.id]
                            : selected.filter((id) => id !== lead.id),
                        )
                      }
                      className="accent-[#087f8c]"
                    />
                    <span className="flex-1">
                      <span className="block text-xs font-bold">{lead.name}</span>
                      <span className="text-[9px] text-slate-400">
                        {lead.company} · {lead.email}
                      </span>
                    </span>
                  </label>
                ))}
            </div>
            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                disabled={!selected.length}
                onClick={() => void enrollLeads()}
                className="primary-action disabled:opacity-40"
              >
                Enroll {selected.length} leads
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
