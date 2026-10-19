import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AccountApi, api, ContactApi, ContactContextApi, SalesTaskApi } from "../lib/api";
import { TopBar } from "../components/TopBar";
import { useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/crm")({
  component: CrmPage,
  head: () => ({ meta: [{ title: "CRM · SalesSync AI" }] }),
});
type Tab = "accounts" | "contacts" | "tasks";

function CrmPage() {
  const token = useAppSelector((state) => state.app.auth.accessToken);
  const team = useAppSelector((state) => state.app.team);
  const [tab, setTab] = useState<Tab>("accounts");
  const [accounts, setAccounts] = useState<AccountApi[]>([]);
  const [contacts, setContacts] = useState<ContactApi[]>([]);
  const [tasks, setTasks] = useState<SalesTaskApi[]>([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedContact, setSelectedContact] = useState<ContactApi | null>(null);
  const [contactContext, setContactContext] = useState<ContactContextApi | null>(null);
  const [contextLoading, setContextLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token || !team.id) return;
    setLoading(true);
    try {
      const [a, c, t] = await Promise.all([
        api.getAccounts(token, team.id),
        api.getContacts(token, team.id),
        api.getSalesTasks(team.currentUserRole === "rep" ? "mine" : "team", token, team.id),
      ]);
      setAccounts(a.data);
      setContacts(c.data);
      setTasks(t.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load CRM data");
    } finally {
      setLoading(false);
    }
  }, [token, team.id, team.currentUserRole]);
  useEffect(() => {
    void load();
  }, [load]);

  const records = useMemo(() => {
    const term = query.toLowerCase();
    if (tab === "accounts")
      return accounts.filter((x) =>
        `${x.name} ${x.domain || ""} ${x.industry || ""}`.toLowerCase().includes(term),
      );
    if (tab === "contacts")
      return contacts.filter((x) =>
        `${x.first_name} ${x.last_name} ${x.email || ""} ${x.account_name || ""}`
          .toLowerCase()
          .includes(term),
      );
    return tasks.filter((x) =>
      `${x.title} ${x.task_type} ${x.priority}`.toLowerCase().includes(term),
    );
  }, [accounts, contacts, tasks, query, tab]);

  function openCreate() {
    setForm(
      tab === "accounts"
        ? { name: "", domain: "", industry: "", country: "" }
        : tab === "contacts"
          ? {
              first_name: "",
              last_name: "",
              email: "",
              job_title: "",
              account_id: "",
              lifecycle_stage: "Lead",
            }
          : {
              title: "",
              task_type: "Follow-up",
              priority: "Medium",
              due_at: "",
              description: "",
              contact_id: "",
            },
    );
    setModal(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token || !team.id) return;
    try {
      if (tab === "accounts")
        await api.createAccount(
          {
            name: form.name,
            domain: form.domain || null,
            industry: form.industry || null,
            country: form.country || null,
          },
          token,
          team.id,
        );
      else if (tab === "contacts")
        await api.createContact(
          {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email || null,
            job_title: form.job_title || null,
            account_id: form.account_id || null,
            lifecycle_stage: form.lifecycle_stage,
          },
          token,
          team.id,
        );
      else
        await api.createSalesTask(
          {
            title: form.title,
            task_type: form.task_type,
            priority: form.priority,
            due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
            contact_id: form.contact_id || null,
            description: form.description || null,
          },
          token,
          team.id,
        );
      setModal(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create record");
    }
  }

  async function toggleTask(task: SalesTaskApi) {
    if (!token || !team.id) return;
    const next = task.status === "Completed" ? "Open" : "Completed";
    setError("");
    setTasks((current) => current.map((x) => (x.id === task.id ? { ...x, status: next } : x)));
    try {
      await api.updateSalesTask(task.id, { status: next }, token, team.id);
    } catch (err) {
      setTasks((current) => current.map((x) => (x.id === task.id ? task : x)));
      setError(err instanceof Error ? err.message : "Could not update task");
    }
  }

  async function viewContact(contact: ContactApi) {
    if (!token || !team.id) return;
    setSelectedContact(contact);
    setContactContext(null);
    setContextLoading(true);
    try {
      const response = await api.getContactContext(contact.id, token, team.id);
      setContactContext(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load contact history");
    } finally {
      setContextLoading(false);
    }
  }

  const overdue = tasks.filter(
    (task) => task.status !== "Completed" && task.due_at && new Date(task.due_at) < new Date(),
  ).length;
  return (
    <>
      <TopBar title="CRM" />
      <div className="page-shell space-y-5">
        <section className="crm-page-header">
          <div>
            <h1 className="crm-page-title">Accounts & Contacts</h1>
            <p className="crm-page-description">
              Companies, people and the next actions required to move revenue.
            </p>
          </div>
          <button onClick={openCreate} className="primary-action">
            <span className="material-symbols-outlined text-[17px]">add</span>New{" "}
            {tab === "accounts" ? "account" : tab === "contacts" ? "contact" : "task"}
          </button>
        </section>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
        <section className="grid grid-cols-3 gap-3">
          {[
            ["Accounts", accounts.length, "domain", "text-blue-700 bg-blue-50"],
            ["Contacts", contacts.length, "contacts", "text-cyan-700 bg-cyan-50"],
            ["Overdue tasks", overdue, "notification_important", "text-rose-700 bg-rose-50"],
          ].map(([label, value, icon, tone]) => (
            <div key={label} className="metric-card p-4">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
                <span className="material-symbols-outlined text-[17px]">{icon}</span>
              </span>
              <p className="mt-3 text-xl font-black">{value}</p>
              <p className="text-[10px] font-bold text-slate-500">{label}</p>
            </div>
          ))}
        </section>
        <section className="section-panel">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 pt-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex gap-1">
              {(["accounts", "contacts", "tasks"] as Tab[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`border-b-2 px-4 py-3 text-[11px] font-bold capitalize ${tab === item ? "border-primary text-primary" : "border-transparent text-slate-500"}`}
                >
                  {item}
                  <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px]">
                    {item === "accounts"
                      ? accounts.length
                      : item === "contacts"
                        ? contacts.length
                        : tasks.length}
                  </span>
                </button>
              ))}
            </div>
            <label className="control mb-2 flex min-h-0 items-center gap-2 px-3 py-2">
              <span className="material-symbols-outlined text-[16px] text-slate-400">search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent text-xs outline-none"
                placeholder={`Search ${tab}...`}
              />
            </label>
          </div>
          {loading ? (
            <div className="empty-state">
              <span className="material-symbols-outlined animate-spin text-primary">
                progress_activity
              </span>
              Loading CRM...
            </div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
              <p className="font-bold">No {tab} yet</p>
              <button onClick={openCreate} className="text-xs font-bold text-primary">
                Create the first one
              </button>
            </div>
          ) : tab === "accounts" ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[720px]">
                <thead>
                  <tr>
                    {["Account", "Domain", "Industry", "Country", "Employees", "Updated"].map(
                      (heading) => (
                        <th key={heading} className="text-left">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(records as AccountApi[]).map((x) => (
                    <tr key={x.id} className="border-t border-slate-100">
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-50 text-[9px] font-semibold text-blue-700">
                            {x.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-semibold text-slate-800">{x.name}</span>
                        </div>
                      </td>
                      <td className="text-primary">{x.domain || "No domain"}</td>
                      <td>{x.industry || "Not set"}</td>
                      <td>{x.country || "Not set"}</td>
                      <td data-numeric>{x.employee_count || "Not set"}</td>
                      <td className="text-slate-500" data-numeric>
                        {new Date(x.updated_at || x.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === "contacts" ? (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    {["Contact", "Account", "Title", "Lifecycle"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(records as ContactApi[]).map((x) => (
                    <tr
                      key={x.id}
                      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                      onClick={() => void viewContact(x)}
                    >
                      <td className="px-5 py-3">
                        <p className="text-xs font-bold">
                          {x.first_name} {x.last_name}
                        </p>
                        <p className="text-[9px] text-slate-400">{x.email || "No email"}</p>
                      </td>
                      <td className="px-5 py-3 text-[10px]">{x.account_name || "—"}</td>
                      <td className="px-5 py-3 text-[10px]">{x.job_title || "—"}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-primary/8 px-2 py-1 text-[9px] font-bold text-primary">
                          {x.lifecycle_stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(records as SalesTaskApi[]).map((x) => (
                <div key={x.id} className="flex items-center gap-3 px-5 py-4">
                  <button
                    onClick={() => void toggleTask(x)}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${x.status === "Completed" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"}`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {x.status === "Completed" ? "check" : ""}
                    </span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-bold ${x.status === "Completed" ? "text-slate-400 line-through" : ""}`}
                    >
                      {x.title}
                    </p>
                    <p className="mt-1 text-[9px] text-slate-400">
                      {x.task_type} ·{" "}
                      {x.due_at ? new Date(x.due_at).toLocaleString() : "No due date"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${x.priority === "Urgent" || x.priority === "High" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}`}
                  >
                    {x.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        {selectedContact && (
          <section className="section-panel p-5" aria-label="Contact history">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  {selectedContact.first_name} {selectedContact.last_name}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedContact.account_name || "No account"} ·{" "}
                  {selectedContact.email || "No email"}
                </p>
              </div>
              <button
                type="button"
                className="secondary-action"
                onClick={() => setSelectedContact(null)}
              >
                Close
              </button>
            </div>
            {contextLoading ? (
              <p className="mt-4 text-sm">Loading history…</p>
            ) : (
              contactContext && (
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <History
                    title="Prospects"
                    items={contactContext.leads.map(
                      (x) => `${x.name} · ${x.status}${x.score != null ? ` · Fit ${x.score}` : ""}`,
                    )}
                  />
                  <History
                    title="Emails"
                    items={contactContext.emails.map((x) => `${x.subject} · ${x.status}`)}
                  />
                  <History
                    title="Meetings"
                    items={contactContext.meetings.map(
                      (x) =>
                        `${x.date} ${x.time} · ${x.status}${x.meet_url ? ` · ${x.meet_url}` : ""}`,
                    )}
                  />
                  <History
                    title="Deals"
                    items={contactContext.deals.map((x) => `${x.name} · ${x.stage} · ${x.amount}`)}
                  />
                  <History
                    title="Follow-up tasks"
                    items={contactContext.tasks.map((x) => `${x.title} · ${x.status}`)}
                  />
                </div>
              )
            )}
          </section>
        )}
      </div>
      {modal && (
        <div className="modal-backdrop">
          <form onSubmit={submit} className="modal-surface max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-black capitalize">New {tab.slice(0, -1)}</h2>
              <button type="button" onClick={() => setModal(false)} className="icon-button">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              {tab === "accounts" ? (
                <>
                  <Input label="Company name" name="name" form={form} setForm={setForm} required />
                  <Input label="Domain" name="domain" form={form} setForm={setForm} />
                  <Input label="Industry" name="industry" form={form} setForm={setForm} />
                  <Input label="Country" name="country" form={form} setForm={setForm} />
                </>
              ) : tab === "contacts" ? (
                <>
                  <Input
                    label="First name"
                    name="first_name"
                    form={form}
                    setForm={setForm}
                    required
                  />
                  <Input label="Last name" name="last_name" form={form} setForm={setForm} />
                  <Input
                    label="Work email"
                    name="email"
                    type="email"
                    form={form}
                    setForm={setForm}
                  />
                  <Input label="Job title" name="job_title" form={form} setForm={setForm} />
                  <label className="sm:col-span-2 text-[10px] font-bold uppercase text-slate-500">
                    Account
                    <select
                      value={form.account_id || ""}
                      onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                      className="control mt-1.5 w-full px-3 text-sm"
                    >
                      <option value="">No account</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <Input label="Task title" name="title" form={form} setForm={setForm} required />
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Contact
                    <select
                      value={form.contact_id || ""}
                      onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                      className="control mt-1.5 w-full px-3 text-sm"
                    >
                      <option value="">No contact</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    label="Due date"
                    name="due_at"
                    type="datetime-local"
                    form={form}
                    setForm={setForm}
                  />
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Type
                    <select
                      value={form.task_type}
                      onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                      className="control mt-1.5 w-full px-3 text-sm"
                    >
                      {["Follow-up", "Email", "Call", "Meeting", "General"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Priority
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="control mt-1.5 w-full px-3 text-sm"
                    >
                      {["Low", "Medium", "High", "Urgent"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button type="button" onClick={() => setModal(false)} className="secondary-action">
                Cancel
              </button>
              <button className="primary-action">Create</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function History({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-bold">
        {title} <span className="text-slate-400">{items.length}</span>
      </h3>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${index}-${item}`} className="break-words text-xs text-slate-600">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-400">No records yet</p>
      )}
    </div>
  );
}

function Input({
  label,
  name,
  form,
  setForm,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  form: Record<string, string>;
  setForm: (value: Record<string, string>) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="text-[10px] font-bold uppercase text-slate-500">
      {label}
      <input
        required={required}
        type={type}
        value={form[name] || ""}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="control mt-1.5 w-full px-3 text-sm normal-case outline-none"
      />
    </label>
  );
}
