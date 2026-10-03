import { useEffect, useState } from "react";
import { api } from "../lib/api";

function ProviderLogo({ provider }: { provider: "google" | "github" }) {
  if (provider === "github") {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor">
        <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.303-5.467-1.333-5.467-5.93 0-1.31.467-2.38 1.235-3.22-.135-.303-.54-1.524.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.652.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.922.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.295 24 17.795 24 12.5c0-6.63-5.37-12-12-12Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.87 46.98 24.55Z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.78-4.59l-7.98-6.19A23.8 23.8 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

export function SocialSignIn({ link = false }: { link?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (link) return;
    const reason = new URLSearchParams(window.location.search).get("social_error");
    if (reason) setError(reason === "account_exists"
      ? "This account already exists or is linked. Sign in with your existing method, then connect the provider in Settings."
      : "Social sign-in was cancelled or could not be completed. Please try again.");
  }, [link]);

  async function start(provider: "google" | "github") {
    setBusy(provider);
    setError("");
    try {
      const result = await api.socialSignIn(provider, link);
      window.location.assign(result.data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start sign-in.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="rounded-xl bg-error/5 p-3 text-sm text-error">{error}</p>}
      <div className={`grid gap-3 ${link ? "sm:grid-cols-2" : ""}`}>
        {(["google", "github"] as const).map((provider) => (
          <button key={provider} type="button" disabled={busy !== null}
            onClick={() => void start(provider)}
            aria-busy={busy === provider}
            className="secondary-action flex min-h-12 items-center justify-center gap-3 bg-white disabled:opacity-60">
            <ProviderLogo provider={provider} />
            <span>{busy === provider ? "Connecting..." : `${link ? "Connect" : "Continue with"} ${provider === "google" ? "Google" : "GitHub"}`}</span>
          </button>
        ))}
      </div>
      {!link && <p className="text-center text-xs text-on-surface-variant">or sign in with email</p>}
    </div>
  );
}
