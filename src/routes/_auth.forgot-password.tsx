import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AuthField, AuthLayout } from "../components/AuthLayout";
import { api, setAccessToken } from "../lib/api";

export const Route = createFileRoute("/_auth/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password · SalesSync AI" }] }),
  component: PasswordRecovery,
});

function PasswordRecovery() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (step === "reset" && (password !== confirmation || password.length < 8 || new TextEncoder().encode(password).length > 72)) {
      setError("Passwords must match and contain at least 8 characters, up to 72 bytes.");
      return;
    }
    setBusy(true);
    try {
      if (step === "request") {
        await api.requestPasswordReset(email);
        setStep("reset");
      } else {
        await api.resetPassword(token.trim(), password);
        setAccessToken(null);
        setToken("");
        setPassword("");
        setConfirmation("");
        setStep("done");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reset your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout eyebrow="Account recovery" title="Reset your password" description="Recover access to your workspace securely.">
      {step === "done" ? (
        <p role="status" className="text-sm">Your password has been updated and previous sessions have expired. Log in with your new password.</p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          {step === "request" ? (
            <AuthField label="Work email" type="email" placeholder="you@company.com" value={email} onChange={setEmail} autoComplete="email" />
          ) : (
            <>
              <p role="status" className="text-sm">If an account exists for that email, a recovery code will arrive shortly. Paste the full code below within 15 minutes.</p>
              <AuthField label="Recovery code" placeholder="Paste your recovery code" value={token} onChange={setToken} autoComplete="one-time-code" />
              <AuthField label="New password" type="password" placeholder="At least 8 characters" value={password} onChange={setPassword} autoComplete="new-password" />
              <AuthField label="Confirm password" type="password" placeholder="Repeat your new password" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
              <button type="button" disabled={busy} onClick={() => { setStep("request"); setError(""); }} className="text-sm text-primary">Request another code</button>
            </>
          )}
          <button disabled={busy} className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60">
            {busy ? "Please wait..." : step === "request" ? "Send recovery code" : "Reset password"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="font-bold text-primary">Back to login</Link></p>
    </AuthLayout>
  );
}
