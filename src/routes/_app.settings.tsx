import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { demoLogout, setIntegration, updateProfile } from "../store/appSlice";
import { logoutAccount } from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { api } from "../lib/api";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · SalesSync AI" }] }),
  component: Settings,
});

function Settings() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.app.profile);
  const auth = useAppSelector((state) => state.app.auth);
  const integrations = useAppSelector((state) => state.app.integrations);
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [gmailLoading, setGmailLoading] = useState(true);

  const [calendlyModalOpen, setCalendlyModalOpen] = useState(false);
  const [calendlyApiKey, setCalendlyApiKey] = useState(integrations.calendlyApiKey);
  const [calendlyEventTypeId, setCalendlyEventTypeId] = useState(integrations.calendlyEventTypeId);

  const [apolloModalOpen, setApolloModalOpen] = useState(false);
  const [apolloApiKey, setApolloApiKey] = useState(integrations.apolloApiKey);

  const token = auth.accessToken ?? localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) return;
    api
      .getGmailStatus(token)
      .then((res) => {
        setGmailConnected(res.data.connected);
        setGmailEmail(res.data.email ?? null);
        dispatch(setIntegration({ integration: "gmail", value: res.data.connected }));
      })
      .catch(() => {})
      .finally(() => setGmailLoading(false));
  }, [token]);

  const connectGmail = async () => {
    if (!token) return;
    try {
      const res = await api.getGmailAuthUrl(token);
      window.location.href = res.data.url;
    } catch {
      // handled
    }
  };

  const saveCalendly = () => {
    dispatch(setIntegration({ integration: "calendlyApiKey", value: calendlyApiKey }));
    dispatch(setIntegration({ integration: "calendlyEventTypeId", value: calendlyEventTypeId }));
    dispatch(setIntegration({ integration: "calendly", value: !!(calendlyApiKey && calendlyEventTypeId) }));
    setCalendlyModalOpen(false);
  };

  const saveApollo = () => {
    dispatch(setIntegration({ integration: "apolloApiKey", value: apolloApiKey }));
    dispatch(setIntegration({ integration: "apollo", value: !!apolloApiKey }));
    setApolloModalOpen(false);
  };

  function saveProfile(event: FormEvent) {
    event.preventDefault();
    dispatch(updateProfile(draft));
    setSaved(true);
  }

  return (
    <>
      <TopBar title="Settings" />
      <div className="page-shell max-w-5xl space-y-5">
        <section className="section-panel p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold">Profile</h2>
            <p className="text-sm text-on-surface-variant">
              Basic account information used across emails and proposals.
            </p>
          </div>
          <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
            {(Object.keys(draft) as (keyof typeof draft)[]).map((key) => (
              <label key={key} className="text-sm font-semibold capitalize">
                {key}
                <input
                  className="control mt-2 w-full px-4 py-2.5 font-normal outline-none"
                  value={draft[key]}
                  onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                />
              </label>
            ))}
            <div className="flex items-center gap-3 md:col-span-2">
              <button className="primary-action">Save profile</button>
              {saved && <span className="text-sm font-semibold text-green-700">Changes saved</span>}
            </div>
          </form>
        </section>

        <section className="section-panel p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold">Integrations</h2>
            <p className="text-sm text-on-surface-variant">
              Connect the must-have services that power lead intake, outreach, and booking.
            </p>
          </div>
          <div className="divide-y divide-outline-variant">
            <Integration
              icon="mail"
              name="Gmail"
              description={
                gmailEmail ? `Connected as ${gmailEmail}` : "Send emails from your Gmail account."
              }
              connected={gmailConnected}
              loading={gmailLoading}
              onToggle={connectGmail}
            />
            <Integration
              icon="calendar_month"
              name="Calendly"
              description={
                integrations.calendly
                  ? "Connected"
                  : "Schedule meetings and sync with your calendar."
              }
              connected={integrations.calendly}
              onToggle={() => setCalendlyModalOpen(true)}
            />
            <Integration
              icon="person_search"
              name="Apollo"
              description={
                integrations.apollo ? "Connected" : "Pull leads using filters generated from your ICP."
              }
              connected={integrations.apollo}
              onToggle={() => setApolloModalOpen(true)}
            />
          </div>
        </section>

        <section className="section-panel flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="font-bold">Account session</h2>
            <p className="text-sm text-on-surface-variant">
              Authentication is represented as a frontend flow until the backend provider is added.
            </p>
          </div>
          <Link
            to="/login"
            onClick={() => {
              if (auth.accessToken) void dispatch(logoutAccount(auth.accessToken));
              dispatch(demoLogout());
            }}
            className="secondary-action border-error/40 text-error hover:border-error hover:bg-error/5 hover:text-error"
          >
            Log out
          </Link>
        </section>
      </div>

      {calendlyModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-surface w-full max-w-md">
            <div className="flex items-center justify-between border-b border-outline-variant p-5">
              <h3 className="text-lg font-bold">Connect Calendly</h3>
              <button
                onClick={() => setCalendlyModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm text-on-surface-variant">
                Enter your Calendly API key and Event Type ID to enable scheduling.
              </p>
              <label className="block text-sm font-semibold">
                API Key
                <input
                  type="password"
                  className="control mt-2 w-full px-4 py-2.5 font-normal outline-none"
                  value={calendlyApiKey}
                  onChange={(e) => setCalendlyApiKey(e.target.value)}
                  placeholder="Paste your Calendly API key"
                />
              </label>
              <label className="block text-sm font-semibold">
                Event Type ID
                <input
                  type="text"
                  className="control mt-2 w-full px-4 py-2.5 font-normal outline-none"
                  value={calendlyEventTypeId}
                  onChange={(e) => setCalendlyEventTypeId(e.target.value)}
                  placeholder="e.g. abc123-def456"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-outline-variant p-5">
              <button
                onClick={() => setCalendlyModalOpen(false)}
                className="secondary-action"
              >
                Cancel
              </button>
              <button
                onClick={saveCalendly}
                disabled={!calendlyApiKey || !calendlyEventTypeId}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {apolloModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-surface w-full max-w-md">
            <div className="flex items-center justify-between border-b border-outline-variant p-5">
              <h3 className="text-lg font-bold">Connect Apollo</h3>
              <button
                onClick={() => setApolloModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm text-on-surface-variant">
                Enter your Apollo API key to enable lead sourcing.
              </p>
              <label className="block text-sm font-semibold">
                API Key
                <input
                  type="password"
                  className="control mt-2 w-full px-4 py-2.5 font-normal outline-none"
                  value={apolloApiKey}
                  onChange={(e) => setApolloApiKey(e.target.value)}
                  placeholder="Paste your Apollo API key"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-outline-variant p-5">
              <button
                onClick={() => setApolloModalOpen(false)}
                className="secondary-action"
              >
                Cancel
              </button>
              <button
                onClick={saveApollo}
                disabled={!apolloApiKey}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Integration({
  icon,
  name,
  description,
  connected,
  loading,
  onToggle,
}: {
  icon: string;
  name: string;
  description: string;
  connected: boolean;
  loading?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="flex-1 sm:pr-4">
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={loading}
        className={`min-w-28 rounded-lg px-4 py-2 text-sm font-semibold transition ${
          loading
            ? "border border-outline-variant bg-surface text-on-surface-variant"
            : connected
              ? "border border-green-200 bg-green-50 text-green-700"
              : "bg-primary text-white"
        }`}
      >
        {loading ? "Checking…" : connected ? "Connected" : "Connect"}
      </button>
    </div>
  );
}
