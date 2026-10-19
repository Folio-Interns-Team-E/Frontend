import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api, setAccessToken, type MfaSetupApi } from "../lib/api";

export function MfaSettings({ accessToken }: { accessToken: string }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<MfaSetupApi | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .getMfaStatus(accessToken)
      .then((response) => {
        if (active) setEnabled(response.data.enabled);
      })
      .catch(() => {
        if (active) setError("Could not load multi-factor authentication status.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accessToken]);

  function resetFeedback() {
    setError("");
    setMessage("");
  }

  async function startSetup() {
    setBusy(true);
    resetFeedback();
    try {
      const response = await api.beginMfaSetup(accessToken);
      setSetup(response.data);
      setSetupCode("");
      setRecoveryCodes([]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start MFA setup.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSetup() {
    if (!setupCode) return;
    setBusy(true);
    resetFeedback();
    try {
      const response = await api.enableMfa(setupCode, accessToken);
      setRecoveryCodes(response.data.recovery_codes);
      setEnabled(true);
      setSetup(null);
      setSetupCode("");
      setMessage("MFA is enabled. Save the recovery codes before leaving this page.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not enable MFA.");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateCodes() {
    if (!recoveryCode) return;
    setBusy(true);
    resetFeedback();
    try {
      const response = await api.regenerateMfaRecoveryCodes(recoveryCode, accessToken);
      setRecoveryCodes(response.data.recovery_codes);
      setRecoveryCode("");
      setMessage("Previous recovery codes were revoked. Save this new set now.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not regenerate recovery codes.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!password || !disableCode) return;
    setBusy(true);
    resetFeedback();
    try {
      await api.disableMfa(password, disableCode, accessToken);
      setAccessToken(null);
      window.location.assign("/login");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not disable MFA.");
      setBusy(false);
    }
  }

  async function copyRecoveryCodes() {
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setMessage("Recovery codes copied. Store them in a password manager.");
  }

  async function copySetupKey() {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setMessage("Setup key copied.");
      setError("");
    } catch {
      setError("Your browser could not copy the key. Select it and copy it manually.");
    }
  }

  return (
    <section
      className="section-panel space-y-4 p-5 sm:p-6"
      aria-labelledby="mfa-title"
      aria-busy={busy || loading}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 id="mfa-title" className="font-bold">
            Multi-factor authentication
          </h2>
          <p className="text-sm text-on-surface-variant">
            Require an authenticator-app or one-time recovery code after your password.
          </p>
        </div>
        <span
          className={`status-badge ${enabled ? "status-badge-success" : "status-badge-neutral"}`}
        >
          {loading ? "Checking" : enabled ? "Enabled" : "Not enabled"}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      )}

      {!loading && !enabled && !setup && (
        <button
          type="button"
          className="primary-action"
          disabled={busy}
          onClick={() => void startSetup()}
        >
          Set up authenticator
        </button>
      )}

      {setup && (
        <div className="space-y-4 rounded-lg border border-outline-variant bg-surface-container p-4">
          <div>
            <p className="text-sm font-semibold">1. Add SaleSync to your authenticator app</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              In Google Authenticator, Microsoft Authenticator, Authy, 1Password, or another TOTP
              app, scan this QR code. Choose <strong>Time based</strong> if the app asks. This setup
              expires in {Math.floor(setup.expires_in / 60)} minutes.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="w-fit rounded-lg border border-outline-variant bg-white p-3">
                <QRCodeSVG
                  value={setup.otpauth_uri}
                  size={176}
                  level="M"
                  marginSize={1}
                  title="SaleSync authenticator setup QR code"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-on-surface-variant">
                  Cannot scan the QR code? Enter this setup key manually:
                </p>
                <code className="mt-2 block select-all break-all rounded-md border border-outline-variant bg-white p-3 font-mono text-sm tracking-wider">
                  {setup.secret.match(/.{1,4}/g)?.join(" ") ?? setup.secret}
                </code>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => void copySetupKey()}
                  >
                    Copy setup key
                  </button>
                  <a href={setup.otpauth_uri} className="secondary-action inline-flex sm:hidden">
                    Open authenticator app
                  </a>
                </div>
              </div>
            </div>
          </div>
          <label className="block text-sm font-semibold">
            2. Enter the current six-digit code
            <input
              className="control mt-2 w-full px-4 py-2.5 font-normal"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={setupCode}
              onChange={(event) => setSetupCode(event.target.value)}
              placeholder="123456"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="primary-action"
              disabled={busy || setupCode.length < 6}
              onClick={() => void confirmSetup()}
            >
              {busy ? "Verifying..." : "Verify and enable"}
            </button>
            <button
              type="button"
              className="secondary-action"
              disabled={busy}
              onClick={() => {
                setSetup(null);
                setSetupCode("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {recoveryCodes.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
          <p className="text-sm font-semibold">Save these one-time recovery codes</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            They will not be shown again. Each code works once.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm tabular-nums">
            {recoveryCodes.map((recoveryCode) => (
              <code key={recoveryCode}>{recoveryCode}</code>
            ))}
          </div>
          <button
            type="button"
            className="secondary-action mt-4"
            onClick={() => void copyRecoveryCodes()}
          >
            Copy recovery codes
          </button>
        </div>
      )}

      {enabled && (
        <div className="grid gap-4 border-t border-outline-variant pt-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Replace recovery codes</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Enter a current authenticator code. Existing recovery codes will stop working.
            </p>
            <input
              className="control mt-3 w-full px-4 py-2.5"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={recoveryCode}
              onChange={(event) => setRecoveryCode(event.target.value)}
              placeholder="Current authenticator code"
            />
            <button
              type="button"
              className="secondary-action mt-3"
              disabled={busy || recoveryCode.length < 6}
              onClick={() => void regenerateCodes()}
            >
              Generate new codes
            </button>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-error">Disable MFA</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Requires your password and a current authenticator or recovery code. All devices will
              be signed out.
            </p>
            <input
              type="password"
              className="control mt-3 w-full px-4 py-2.5"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Current password"
            />
            <input
              className="control mt-3 w-full px-4 py-2.5"
              inputMode="text"
              autoComplete="one-time-code"
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value)}
              placeholder="Authenticator or recovery code"
            />
            <button
              type="button"
              className="secondary-action mt-3 border-error/40 text-error"
              disabled={busy || !password || disableCode.length < 6}
              onClick={() => void disable()}
            >
              Disable and sign out
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
