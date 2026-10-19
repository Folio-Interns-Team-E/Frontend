import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { AuthField, AuthLayout } from "../components/AuthLayout";
import { loginAccount, verifyMfaLogin } from "../store/apiThunks";
import { clearApiFeedback, clearMfaChallenge } from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { SocialSignIn } from "../components/SocialSignIn";

export const Route = createFileRoute("/_auth/login")({
  head: () => ({ meta: [{ title: "Log in · SaleSync AI" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const auth = useAppSelector((state) => state.app.auth);

  useEffect(() => {
    if (auth.needsVerification && auth.verifyEmail) {
      void navigate({ to: "/verify-otp", search: { email: auth.verifyEmail } });
    }
  }, [auth.needsVerification, auth.verifyEmail, navigate]);

  function clearError() {
    if (auth.error) dispatch(clearApiFeedback());
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const result = await dispatch(loginAccount({ email, password }));
    if (loginAccount.fulfilled.match(result)) {
      if (result.payload.needs_mfa) return;
      void navigate({ to: "/dashboard" });
      return;
    }
  }

  async function handleMfa(event: FormEvent) {
    event.preventDefault();
    if (!auth.mfaTicket) return;
    const result = await dispatch(verifyMfaLogin({ ticket: auth.mfaTicket, code: mfaCode }));
    if (verifyMfaLogin.fulfilled.match(result)) void navigate({ to: "/dashboard" });
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to your workspace"
      description="Pick up where your sales agents left off."
    >
      {!auth.needsMfa && (
        <div className="mb-5">
          <SocialSignIn />
        </div>
      )}
      <form className="space-y-5" onSubmit={auth.needsMfa ? handleMfa : handleSubmit}>
        {auth.error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-xs text-error">
            {auth.error}
          </div>
        )}
        {auth.needsMfa ? (
          <>
            <p className="text-sm leading-6 text-on-surface-variant">
              Enter the six-digit code from your authenticator app, or use one unused recovery code.
            </p>
            <AuthField
              label="Authentication code"
              placeholder="123456 or recovery code"
              value={mfaCode}
              onChange={(value) => {
                clearError();
                setMfaCode(value);
              }}
              autoComplete="one-time-code"
            />
          </>
        ) : (
          <>
            <AuthField
              label="Work email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(v) => {
                clearError();
                setEmail(v);
              }}
              autoComplete="email"
            />
            <AuthField
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(v) => {
                clearError();
                setPassword(v);
              }}
              autoComplete="current-password"
              action={
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="font-semibold text-primary hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
            />
          </>
        )}

        {!auth.needsMfa && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-outline-variant accent-primary"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        )}

        <button disabled={auth.status === "loading"} className="primary-action h-11 w-full text-sm">
          {auth.status === "loading"
            ? "Verifying..."
            : auth.needsMfa
              ? "Verify and log in"
              : "Log in"}
          <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
        </button>
        {auth.needsMfa && (
          <button
            type="button"
            className="secondary-action h-11 w-full"
            onClick={() => dispatch(clearMfaChallenge())}
          >
            Back to password
          </button>
        )}
      </form>

      {!auth.needsMfa && (
        <p className="mt-7 text-center text-xs text-on-surface-variant">
          New to SaleSync AI?{" "}
          <Link to="/register" className="font-bold text-primary hover:underline">
            Create your account
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
