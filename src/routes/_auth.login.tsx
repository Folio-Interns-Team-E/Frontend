import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { AuthDivider, AuthField, AuthLayout, GoogleButton } from "../components/AuthLayout";
import { loginAccount } from "../store/apiThunks";
import { clearApiFeedback, createTeamLocal, demoLogin } from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useGoogleLogin } from "@react-oauth/google";

export const Route = createFileRoute("/_auth/login")({
  head: () => ({ meta: [{ title: "Log in · SalesSync AI" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAppSelector((state) => state.app.auth);

  useEffect(() => {
    if (auth.needsVerification && auth.verifyEmail) {
      void navigate({ to: "/verify-otp", search: { email: auth.verifyEmail } });
    }
  }, [auth.needsVerification, auth.verifyEmail, navigate]);

  function clearError() {
    if (auth.error) dispatch(clearApiFeedback());
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;

      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const user = await response.json();

      console.log(user);

      //void navigate({ to: "/dashboard" });
    },

    onError: () => {
      console.log("Google login failed");
    },
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const result = await dispatch(loginAccount({ email, password }));
    if (loginAccount.fulfilled.match(result)) {
      void navigate({ to: "/team-setup" });
      return;
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to your workspace"
      description="Pick up where your sales agents left off."
    >
      <GoogleButton label="Continue with Google" onClick={() => googleLogin()} />
      <AuthDivider />

      <form className="space-y-5" onSubmit={handleSubmit}>
        {auth.error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-xs text-error">
            {auth.error}
          </div>
        )}
        <AuthField
          label="Work email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(v) => { clearError(); setEmail(v); }}
          autoComplete="email"
        />
        <AuthField
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(v) => { clearError(); setPassword(v); }}
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-on-surface-variant">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-outline-variant accent-primary"
            />
            Remember me
          </label>
          <button type="button" className="text-xs font-bold text-primary hover:underline">
            Forgot password?
          </button>
        </div>

        <button
          disabled={auth.status === "loading"}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d2d39] to-primary text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-60"
        >
          {auth.status === "loading" ? "Logging in..." : "Log in"}
          <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
        </button>
      </form>

      <p className="mt-7 text-center text-xs text-on-surface-variant">
        New to SalesSync AI?{" "}
        <Link to="/register" className="font-bold text-primary hover:underline">
          Create your account
        </Link>
      </p>
    </AuthLayout>
  );
}
