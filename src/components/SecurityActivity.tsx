import { useCallback, useEffect, useRef, useState } from "react";
import { api, type SecurityEventApi } from "../lib/api";

const labels: Record<SecurityEventApi["action"], string> = {
  password_login: "Signed in with password",
  password_reset: "Password reset completed",
  google_login: "Signed in with Google",
  github_login: "Signed in with GitHub",
  google_linked: "Google sign-in connected",
  github_linked: "GitHub sign-in connected",
};

export function SecurityActivity({ accessToken }: { accessToken: string }) {
  const [events, setEvents] = useState<SecurityEventApi[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const load = useCallback(async (after?: string) => {
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.securityActivity(accessToken, after);
      if (id !== requestId.current) return;
      setEvents((previous) => after ? [...previous, ...data.events] : data.events);
      setCursor(data.next_cursor);
      setLoaded(true);
    } catch {
      if (id === requestId.current) setError("Could not load your security activity. Please try again.");
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
    return () => { requestId.current += 1; };
  }, [load]);

  return (
    <section className="section-panel space-y-4 p-5 sm:p-6" aria-labelledby="security-activity-title" aria-busy={busy}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="security-activity-title" className="font-bold">Security activity</h2>
          <p className="text-sm text-on-surface-variant">Your recent sign-ins and account changes. Times are shown in your local timezone.</p>
        </div>
        <button type="button" className="secondary-action disabled:opacity-60" disabled={busy} onClick={() => void load()}>Refresh</button>
      </div>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {busy && <p role="status" className="text-sm text-on-surface-variant">Loading activity...</p>}
      {!busy && loaded && events.length === 0 && <p className="text-sm text-on-surface-variant">No activity recorded yet. New sign-ins and security changes will appear here.</p>}
      {events.length > 0 && (
        <ul className="divide-y divide-outline-variant">
          {events.map((event) => (
            <li key={event.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="text-sm font-semibold">{labels[event.action] ?? "Account security event"}</span>
              <time dateTime={event.created_at} className="text-xs text-on-surface-variant">
                {new Date(event.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </time>
            </li>
          ))}
        </ul>
      )}
      {cursor && <button type="button" className="secondary-action disabled:opacity-60" disabled={busy} onClick={() => void load(cursor)}>Load older activity</button>}
      <p className="text-xs text-on-surface-variant">History starts when this feature is enabled. Only you can view it through the app.</p>
    </section>
  );
}
