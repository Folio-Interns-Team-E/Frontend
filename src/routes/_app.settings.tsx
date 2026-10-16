import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { demoLogout, setIntegration, updateProfile } from "../store/appSlice";
import { logoutAccount } from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { api, setAccessToken } from "../lib/api";
import { SocialSignIn } from "../components/SocialSignIn";
import { SecurityActivity } from "../components/SecurityActivity";
import { MfaSettings } from "../components/MfaSettings";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · SalesSync AI" }] }),
  component: Settings,
});

function Settings() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.app.profile);
  const auth = useAppSelector((state) => state.app.auth);
  const team = useAppSelector((state) => state.app.team);
  const integrations = useAppSelector((state) => state.app.integrations);
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [logoutAllBusy, setLogoutAllBusy] = useState(false);
  const [logoutAllError, setLogoutAllError] = useState("");

  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");

  const [apolloModalOpen, setApolloModalOpen] = useState(false);
  const [apolloApiKey, setApolloApiKey] = useState("");
  const [apolloMonthlyLimit, setApolloMonthlyLimit] = useState(100);
  const [apolloUsed, setApolloUsed] = useState(0);
  const [apolloConnected, setApolloConnected] = useState(false);
  const [apolloLoading, setApolloLoading] = useState(true);
  const [apolloSaving, setApolloSaving] = useState(false);
  const [apolloError, setApolloError] = useState("");
  const [hunterOpen, setHunterOpen] = useState(false);
  const [hunterKey, setHunterKey] = useState("");
  const [hunterLimit, setHunterLimit] = useState(50);
  const [hunterUsed, setHunterUsed] = useState(0);
  const [hunterConnected, setHunterConnected] = useState(false);
  const [hunterBusy, setHunterBusy] = useState(false);
  const [hunterError, setHunterError] = useState("");

  const token = auth.accessToken;

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

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

  useEffect(() => {
    if (!token) return;
    api
      .getGoogleCalendarStatus(token)
      .then((res) => {
        setCalendarConnected(res.data.connected);
        setCalendarEmail(res.data.email ?? null);
        dispatch(setIntegration({ integration: "calendar", value: res.data.connected }));
      })
      .catch(() => setCalendarError("Could not check Google Calendar connection"))
      .finally(() => setCalendarLoading(false));
  }, [token, dispatch]);

  useEffect(() => {
    if (!token || !team.id) return;
    setApolloLoading(true);
    api
      .getLeadProvider(token, team.id)
      .then((res) => {
        setApolloConnected(res.data.connected);
        setApolloMonthlyLimit(res.data.monthly_limit);
        setApolloUsed(res.data.used_this_month);
        dispatch(setIntegration({ integration: "apollo", value: res.data.connected }));
      })
      .catch(() => {})
      .finally(() => setApolloLoading(false));
  }, [token, team.id, dispatch]);

  useEffect(() => {
    if (!token || !team.id) return;
    api
      .getHunterProvider(token, team.id)
      .then((res) => {
        setHunterConnected(res.data.connected);
        setHunterLimit(res.data.monthly_limit);
        setHunterUsed(res.data.used_this_month);
      })
      .catch(() => setHunterError("Could not check Hunter connection"));
  }, [token, team.id]);

  const saveHunter = async () => {
    if (!token || !team.id || !hunterKey) return;
    setHunterBusy(true);
    setHunterError("");
    try {
      const res = await api.configureHunterProvider(hunterKey, hunterLimit, token, team.id);
      setHunterConnected(true);
      setHunterUsed(res.data.used_this_month);
      setHunterKey("");
      setHunterOpen(false);
    } catch (error) {
      setHunterError(error instanceof Error ? error.message : "Could not save Hunter key");
    } finally {
      setHunterBusy(false);
    }
  };

  const disconnectHunter = async () => {
    if (!token || !team.id) return;
    setHunterBusy(true);
    setHunterError("");
    try {
      await api.disconnectHunterProvider(token, team.id);
      setHunterConnected(false);
      setHunterUsed(0);
      setHunterOpen(false);
    } catch (error) {
      setHunterError(error instanceof Error ? error.message : "Could not disconnect Hunter");
    } finally {
      setHunterBusy(false);
    }
  };

  const connectGmail = async () => {
    if (!token) return;
    try {
      const res = await api.getGmailAuthUrl(token);
      window.location.href = res.data.url;
    } catch {
      // handled
    }
  };

  const connectGoogleCalendar = async () => {
    if (!token) return;
    setCalendarError("");
    try {
      const res = await api.getGoogleCalendarAuthUrl(token);
      window.location.href = res.data.url;
    } catch (error) {
      setCalendarError(
        error instanceof Error ? error.message : "Could not connect Google Calendar",
      );
    }
  };

  const saveApollo = async () => {
    if (!token || !team.id) return;
    setApolloSaving(true);
    setApolloError("");
    try {
      const res = await api.configureLeadProvider(apolloApiKey, apolloMonthlyLimit, token, team.id);
      setApolloConnected(true);
      setApolloUsed(res.data.used_this_month);
      setApolloApiKey("");
      dispatch(setIntegration({ integration: "apollo", value: true }));
      setApolloModalOpen(false);
    } catch (error) {
      setApolloError(error instanceof Error ? error.message : "Could not save Apollo settings");
    } finally {
      setApolloSaving(false);
    }
  };

  const disconnectApollo = async () => {
    if (!token || !team.id) return;
    setApolloSaving(true);
    setApolloError("");
    try {
      await api.disconnectLeadProvider(token, team.id);
      setApolloConnected(false);
      setApolloUsed(0);
      setApolloApiKey("");
      dispatch(setIntegration({ integration: "apollo", value: false }));
      setApolloModalOpen(false);
    } catch (error) {
      setApolloError(error instanceof Error ? error.message : "Could not disconnect Apollo");
    } finally {
      setApolloSaving(false);
    }
  };

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setProfileSaving(true);
    setProfileError("");
    setSaved(false);
    try {
      const response = await api.saveProfile(
        {
          full_name: draft.name,
          company: draft.company,
          job_title: draft.role,
        },
        token,
      );
      const user = response.data;
      dispatch(
        updateProfile({
          name: user.full_name,
          email: user.email,
          company: user.company ?? "",
          role: user.job_title ?? "",
        }),
      );
      setSaved(true);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setProfileSaving(false);
    }
  }

  async function signOutAllDevices() {
    if (!token) return;
    setLogoutAllBusy(true);
    setLogoutAllError("");
    try {
      await api.logoutAll(token);
      setAccessToken(null);
      dispatch(demoLogout());
      window.location.assign("/login");
    } catch (error) {
      setLogoutAllError(
        error instanceof Error
          ? error.message
          : "Could not sign out all devices. Please try again.",
      );
      setLogoutAllBusy(false);
    }
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
                {key === "role" ? "Job title" : key === "email" ? "Email (read-only)" : key}
                <input
                  className="control mt-2 w-full px-4 py-2.5 font-normal outline-none"
                  value={draft[key]}
                  readOnly={key === "email"}
                  onChange={(event) => {
                    setDraft({ ...draft, [key]: event.target.value });
                    setSaved(false);
                  }}
                />
              </label>
            ))}
            <div className="flex items-center gap-3 md:col-span-2">
              <button className="primary-action" disabled={profileSaving || !token}>
                {profileSaving ? "Saving..." : "Save profile"}
              </button>
              {saved && <span className="text-sm font-semibold text-green-700">Changes saved</span>}
              {profileError && (
                <span role="alert" className="text-sm text-error">
                  {profileError}
                </span>
              )}
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
              name="Google Calendar"
              description={
                calendarEmail
                  ? `Connected as ${calendarEmail}. Create meetings with Google Meet links.`
                  : "Create meetings and Google Meet links from SalesSync."
              }
              connected={calendarConnected}
              loading={calendarLoading}
              onToggle={connectGoogleCalendar}
            />
            {calendarError && (
              <p role="alert" className="py-2 text-sm text-error">
                {calendarError}
              </p>
            )}
            <Integration
              icon="person_search"
              name="Apollo"
              description={
                apolloConnected
                  ? `${apolloUsed} of ${apolloMonthlyLimit} monthly enrichment attempts used`
                  : "Pull leads using filters generated from your ICP."
              }
              connected={apolloConnected}
              loading={apolloLoading}
              onToggle={() => setApolloModalOpen(true)}
            />
            <Integration
              icon="travel_explore"
              name="Hunter"
              description={
                hunterConnected
                  ? `${hunterUsed} of ${hunterLimit} workspace lookup attempts used this month`
                  : "Discover companies and reveal contacts with your Hunter API key."
              }
              connected={hunterConnected}
              loading={false}
              onToggle={() => setHunterOpen(true)}
            />
          </div>
        </section>

        <section className="section-panel space-y-4 p-5 sm:p-6">
          <h2 className="font-bold">Connected sign-in methods</h2>
          <p className="text-sm text-on-surface-variant">
            Connect Google or GitHub to sign in to this account. This does not grant access to Gmail
            or repositories.
          </p>
          <SocialSignIn link />
        </section>
        {token && <MfaSettings accessToken={token} />}
        <section className="section-panel flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="font-bold">Account session</h2>
            <p className="text-sm text-on-surface-variant">Sign out of this browser session.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="secondary-action border-error/40 text-error hover:border-error hover:bg-error/5 hover:text-error"
              onClick={() => setLogoutAllOpen(true)}
            >
              Sign out all devices
            </button>
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
          </div>
        </section>
        {token && <SecurityActivity key={auth.userId} accessToken={token} />}
      </div>

      {logoutAllOpen && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal-surface w-full max-w-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-all-title"
          >
            <div className="space-y-3 p-5">
              <h2 id="logout-all-title" className="text-lg font-bold">
                Sign out everywhere?
              </h2>
              <p className="text-sm text-on-surface-variant">
                All current SalesSync sessions, including this one, will stop working. You will need
                to sign in again on every device. Workspace API keys are not affected.
              </p>
              {logoutAllError && (
                <p role="alert" className="text-sm text-error">
                  {logoutAllError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="secondary-action"
                  disabled={logoutAllBusy}
                  onClick={() => setLogoutAllOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-action"
                  disabled={logoutAllBusy}
                  onClick={() => void signOutAllDevices()}
                >
                  {logoutAllBusy ? "Signing out..." : "Sign out all devices"}
                </button>
              </div>
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
              <label className="block text-sm font-semibold">
                Monthly usage limit
                <input
                  type="number"
                  min={1}
                  max={10000}
                  className="control mt-2 w-full px-4 py-2.5 font-normal outline-none"
                  value={apolloMonthlyLimit}
                  onChange={(e) => setApolloMonthlyLimit(Number(e.target.value))}
                />
                <span className="mt-1 block text-xs font-normal text-on-surface-variant">
                  A workspace safety cap; Apollo may apply separate credit limits.
                </span>
              </label>
              {apolloError && <p className="text-sm text-error">{apolloError}</p>}
            </div>
            <div className="flex justify-end gap-3 border-t border-outline-variant p-5">
              {apolloConnected && (
                <button
                  onClick={disconnectApollo}
                  disabled={apolloSaving}
                  className="secondary-action mr-auto border-error/40 text-error"
                >
                  Disconnect
                </button>
              )}
              <button onClick={() => setApolloModalOpen(false)} className="secondary-action">
                Cancel
              </button>
              <button
                onClick={saveApollo}
                disabled={!apolloApiKey || apolloSaving || apolloMonthlyLimit < 1}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-50"
              >
                {apolloSaving ? "Saving…" : "Save securely"}
              </button>
            </div>
          </div>
        </div>
      )}
      {hunterOpen && (
        <div className="modal-backdrop">
          <div className="modal-surface w-full max-w-md p-5">
            <h3 className="text-lg font-bold">Connect Hunter</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              The key is stored encrypted and shared by this workspace. Any member can replace or
              disconnect it, which affects everyone. Company previews do not reveal emails.
            </p>
            <label className="mt-4 block text-sm font-semibold">
              API key
              <input
                type="password"
                autoComplete="off"
                className="control mt-2 w-full px-4 py-2.5"
                value={hunterKey}
                onChange={(e) => setHunterKey(e.target.value)}
              />
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Monthly workspace lookup cap
              <input
                type="number"
                min={1}
                max={1000}
                className="control mt-2 w-full px-4 py-2.5"
                value={hunterLimit}
                onChange={(e) => setHunterLimit(Number(e.target.value))}
              />
            </label>
            <p className="mt-2 text-xs text-on-surface-variant">
              This is a local safety cap, not Hunter's actual credit balance. Each selected domain
              triggers at most one contact lookup.
            </p>
            {hunterError && (
              <p role="alert" className="mt-3 text-sm text-error">
                {hunterError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              {hunterConnected && (
                <button
                  className="secondary-action mr-auto"
                  disabled={hunterBusy}
                  onClick={() => void disconnectHunter()}
                >
                  Disconnect
                </button>
              )}
              <button className="secondary-action" onClick={() => setHunterOpen(false)}>
                Cancel
              </button>
              <button
                className="primary-action"
                disabled={hunterBusy || hunterKey.length < 8 || hunterLimit < 1}
                onClick={() => void saveHunter()}
              >
                {hunterBusy ? "Saving..." : "Save securely"}
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
