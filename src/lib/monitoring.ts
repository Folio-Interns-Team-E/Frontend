import * as Sentry from "@sentry/react";

let initialized = false;
let enabled = false;

function traceSampleRate() {
  const configured = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0.1");
  return Number.isFinite(configured) && configured >= 0 && configured <= 1 ? configured : 0.1;
}

export function initializeMonitoring() {
  if (initialized || typeof window === "undefined") return enabled;
  initialized = true;

  const dsn = String(import.meta.env.VITE_SENTRY_DSN ?? "").trim();
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    tracesSampleRate: traceSampleRate(),
    integrations: [Sentry.browserTracingIntegration()],
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        delete event.request.query_string;
        if (event.request.url) {
          try {
            const url = new URL(event.request.url, window.location.origin);
            event.request.url = `${url.origin}${url.pathname}`;
          } catch {
            delete event.request.url;
          }
        }
        if (event.request.headers) {
          for (const key of Object.keys(event.request.headers)) {
            if (
              ["authorization", "cookie", "set-cookie", "x-api-key"].includes(key.toLowerCase())
            ) {
              event.request.headers[key] = "[Filtered]";
            }
          }
        }
      }
      if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
      return event;
    },
  });
  enabled = true;
  return true;
}

export function captureMonitoringException(error: unknown, context: Record<string, unknown> = {}) {
  if (!initializeMonitoring()) return;
  Sentry.withScope((scope) => {
    scope.setContext("sales_sync", context);
    Sentry.captureException(error);
  });
}

export function reportApiFailure(details: {
  method: string;
  path: string;
  status?: number;
  requestId?: string | null;
  error?: unknown;
}) {
  if (!initializeMonitoring()) return;
  Sentry.withScope((scope) => {
    scope.setLevel("error");
    scope.setTag("api.method", details.method);
    scope.setTag("api.path", details.path.split("?")[0]);
    if (details.status) scope.setTag("api.status", String(details.status));
    if (details.requestId) scope.setTag("request_id", details.requestId);
    if (details.error) Sentry.captureException(details.error);
    else
      Sentry.captureMessage(`API request failed: ${details.method} ${details.path.split("?")[0]}`);
  });
}
