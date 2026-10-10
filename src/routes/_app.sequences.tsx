import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, EmailSuppressionApi, SequenceApi, SequenceEnrollmentApi } from "../lib/api";
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
  const [suppressionOpen, setSuppressionOpen] = useState(false);
  const [suppressions, setSuppressions] = useState<EmailSuppressionApi[]>([]);
  const [suppressionEmail, setSuppressionEmail] = useState("");
  const [deleting, setDeleting] = useState<SequenceApi | null>(null);
  const [historySequence, setHistorySequence] = useState<SequenceApi | null>(null);
  const [enrollments, setEnrollments] = useState<SequenceEnrollmentApi[]>([]);
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
  async function deleteSequence() {
    if (!deleting || !token || !team.id) return;
    try {
      await api.deleteSequence(deleting.id, token, team.id);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete sequence");
    }
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
  async function openSuppressions() {
    if (!token || !team.id) return;
    try {
      setSuppressions((await api.getEmailSuppressions(token, team.id)).data);
      setSuppressionOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load suppression list");
    }
  }
  async function addSuppression(e: FormEvent) {
    e.preventDefault();
    if (!token || !team.id) return;
    await api.addEmailSuppression(suppressionEmail, token, team.id);
    setSuppressionEmail("");
    setSuppressions((await api.getEmailSuppressions(token, team.id)).data);
  }
  async function removeSuppression(id: string) {
    if (!token || !team.id) return;
    await api.removeEmailSuppression(id, token, team.id);
    setSuppressions(suppressions.filter((item) => item.id !== id));
  }
  async function openHistory(item: SequenceApi) {
    if (!token || !team.id) return;
    try {
      setEnrollments((await api.getSequenceEnrollments(item.id, token, team.id)).data);
      setHistorySequence(item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load enrollment history");
    }
  }
  async function cancelEnrollment(enrollmentId: string) {
    if (!historySequence || !token || !team.id) return;
    await api.cancelSequenceEnrollment(historySequence.id, enrollmentId, token, team.id);
    setEnrollments((await api.getSequenceEnrollments(historySequence.id, token, team.id)).data);
    await load();
  }
  async function restartEnrollment(item: SequenceEnrollmentApi) {
    if (!historySequence || !token || !team.id) return;
    const allowReplied = item.status === "Replied";
    if (
      allowReplied &&
      !window.confirm("This lead already replied. Start a new outreach run anyway?")
    )
      return;
    try {
      await api.restartSequenceEnrollment(
        historySequence.id,
        item.id,
        allowReplied,
        token,
        team.id,
      );
      setEnrollments((await api.getSequenceEnrollments(historySequence.id, token, team.id)).data);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not re-enroll lead");
    }
  }
  async function retryEnrollment(enrollmentId: string) {
    if (!historySequence || !token || !team.id) return;
    try {
      await api.retrySequenceEnrollment(historySequence.id, enrollmentId, token, team.id);
      setEnrollments((await api.getSequenceEnrollments(historySequence.id, token, team.id)).data);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not retry failed delivery");
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
          <div className="flex gap-2">
            <button onClick={() => void openSuppressions()} className="secondary-action">
              <span className="material-symbols-outlined text-[17px]">block</span>Suppression list
            </button>
            <button onClick={() => setModal(true)} className="primary-action">
              <span className="material-symbols-outlined text-[17px]">add</span>New sequence
            </button>
          </div>
        </section>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ["Total sequences", items.length, "conversion_path"],
            ["Active", items.filter((x) => x.status === "Active").length, "play_circle"],
            ["Enrolled leads", items.reduce((a, x) => a + x.active_enrollments, 0), "group"],
            ["Emails sent", items.reduce((a, x) => a + x.sent_deliveries, 0), "send"],
            ["Failed", items.reduce((a, x) => a + x.failed_deliveries, 0), "error"],
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
                    <button onClick={() => void openHistory(item)} className="secondary-action">
                      <span className="material-symbols-outlined text-[17px]">history</span>History
                    </button>
                    <button
                      onClick={() => setDeleting(item)}
                      className="icon-button text-red-500 hover:bg-red-50"
                      title="Delete sequence"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
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
      {suppressionOpen && (
        <div className="modal-backdrop">
          <div className="modal-surface max-w-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="section-heading">Deliverability</p>
                <h2 className="mt-1 text-lg font-black">Suppression list</h2>
              </div>
              <button onClick={() => setSuppressionOpen(false)} className="icon-button">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={addSuppression} className="flex gap-2 border-b border-slate-200 p-5">
              <input
                required
                type="email"
                value={suppressionEmail}
                onChange={(e) => setSuppressionEmail(e.target.value)}
                className="control flex-1 px-3 text-sm"
                placeholder="person@company.com"
              />
              <button className="primary-action">Suppress</button>
            </form>
            <div className="custom-scrollbar max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {suppressions.length ? (
                suppressions.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="material-symbols-outlined text-[18px] text-red-500">
                      block
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{item.email}</p>
                      <p className="text-[9px] text-slate-400">
                        {item.reason} · {item.source}
                      </p>
                    </div>
                    <button
                      onClick={() => void removeSuppression(item.id)}
                      className="icon-button"
                      title="Remove"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state py-10">
                  <p className="text-xs">No suppressed addresses.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {deleting && (
        <div className="modal-backdrop">
          <div className="modal-surface max-w-md p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <span className="material-symbols-outlined">delete_forever</span>
            </div>
            <h2 className="mt-4 text-lg font-black">Delete sequence?</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              <span className="font-bold text-slate-700">{deleting.name}</span> and its enrollment
              and delivery history will be permanently deleted. Your leads will not be deleted.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="secondary-action">
                Cancel
              </button>
              <button
                onClick={() => void deleteSequence()}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Delete sequence
              </button>
            </div>
          </div>
        </div>
      )}
      {historySequence && (
        <div className="modal-backdrop">
          <div className="modal-surface max-w-4xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="section-heading">Enrollment history</p>
                <h2 className="mt-1 text-lg font-black">{historySequence.name}</h2>
              </div>
              <button onClick={() => setHistorySequence(null)} className="icon-button">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="custom-scrollbar max-h-[65vh] divide-y divide-slate-100 overflow-y-auto">
              {enrollments.length ? (
                enrollments.map((item) => (
                  <div key={item.id} className="p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black">{item.lead_name}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-black uppercase text-slate-600">
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {item.lead_email} · enrolled {new Date(item.enrolled_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {item.status === "Active" ? (
                          <button
                            onClick={() => void cancelEnrollment(item.id)}
                            className="secondary-action text-red-600"
                          >
                            Cancel run
                          </button>
                        ) : item.status === "Failed" ? (
                          <button
                            onClick={() => void retryEnrollment(item.id)}
                            className="primary-action"
                          >
                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                            Retry failed step
                          </button>
                        ) : (
                          <button
                            onClick={() => void restartEnrollment(item)}
                            className="secondary-action"
                          >
                            <span className="material-symbols-outlined text-[16px]">replay</span>
                            Re-enrol
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.deliveries.length ? (
                        item.deliveries.map((delivery, index) => (
                          <span
                            key={delivery.id}
                            title={delivery.error || undefined}
                            className={`rounded-lg px-2.5 py-1 text-[9px] font-bold ${delivery.status === "Sent" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                          >
                            Step {index + 1}: {delivery.status} · {delivery.attempt_count} attempt
                            {delivery.attempt_count === 1 ? "" : "s"}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400">No delivery attempts yet</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state py-14">
                  <span className="material-symbols-outlined text-3xl text-slate-300">history</span>
                  <p className="text-xs">No enrollment history yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
