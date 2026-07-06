import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { AuthDivider, AuthField, AuthLayout, GoogleButton } from "../components/AuthLayout";
import { registerAccount } from "../store/apiThunks";
import { demoRegister } from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_auth/register")({
  head: () => ({ meta: [{ title: "Create account · SalesSync AI" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAppSelector((state) => state.app.auth);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await dispatch(registerAccount({ fullName: name, email, password }));
    if (registerAccount.fulfilled.match(result)) {
      void navigate({ to: "/login" });
      return;
    }
  }

  const passwordStrength = Math.min(
    3,
    Number(password.length >= 8) +
      Number(/[A-Z]/.test(password) && /[a-z]/.test(password)) +
      Number(/\d|[^A-Za-z0-9]/.test(password)),
  );

  return (
    <AuthLayout
      eyebrow="Start selling smarter"
      title="Create your workspace"
      description="Set up your account, define your ICP, and put your AI sales team to work."
    >
      <GoogleButton label="Sign up with Google" />
      <AuthDivider />

      <form className="space-y-4" onSubmit={handleSubmit}>
        {auth.error && <ApiError message={auth.error} />}
        {auth.accessToken?.startsWith("demo-token") && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary">
            Backend unavailable, so the account was saved in frontend demo mode.
          </div>
        )}
        <AuthField
          label="Full name"
          placeholder="Alex Morgan"
          value={name}
          onChange={setName}
          autoComplete="name"
        />
        <AuthField
          label="Work email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <div>
          <AuthField
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
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
          <div className="mt-2 flex gap-1.5">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full ${
                  passwordStrength >= level
                    ? passwordStrength === 1
                      ? "bg-orange-400"
                      : passwordStrength === 2
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">
            Use 8+ characters with a mix of letters and numbers.
          </p>
        </div>

        <label className="flex items-start gap-2.5 text-[11px] leading-5 text-on-surface-variant">
          <input
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant accent-primary"
          />
          <span>
            I agree to the{" "}
            <button type="button" className="font-bold text-primary hover:underline">
              Terms of Service
            </button>{" "}
            and{" "}
            <button type="button" className="font-bold text-primary hover:underline">
              Privacy Policy
            </button>
            .
          </span>
        </label>

        <button
          disabled={auth.status === "loading"}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d2d39] to-primary text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-60"
        >
          {auth.status === "loading" ? "Creating account..." : "Create account and continue"}
          <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-on-surface-variant">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

function ApiError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-xs text-error">
      {message}
    </div>
  );
}
