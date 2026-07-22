import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AuthLayout } from "../components/AuthLayout";
import { requestOtp, verifyOtp } from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_auth/verify-otp")({
  head: () => ({ meta: [{ title: "Verify email · SalesSync AI" }] }),
  component: VerifyOtp,
  validateSearch: (search: Record<string, unknown>) => ({
    email: (search.email as string) ?? "",
  }),
});

function VerifyOtp() {
  const navigate = useNavigate();
  const { email } = Route.useSearch();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.app.auth);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const displayEmail = email || auth.verifyEmail || "";

  useEffect(() => {
    if (!displayEmail) {
      void navigate({ to: "/register" });
    }
  }, [displayEmail, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== "")) {
      void handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      void handleSubmit(pasted);
    }
  };

  async function handleSubmit(code?: string) {
    const otpCode = code ?? otp.join("");
    if (otpCode.length !== 6 || !displayEmail) return;
    const result = await dispatch(verifyOtp({ email: displayEmail, otp: otpCode }));
    if (verifyOtp.fulfilled.match(result)) {
      void navigate({ to: "/login" });
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || !displayEmail) return;
    await dispatch(requestOtp(displayEmail));
    setResendCooldown(60);
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  }

  return (
    <AuthLayout
      eyebrow="Verify your email"
      title="Enter the 6-digit code"
      description={`We sent a verification code to ${displayEmail}. Enter it below to verify your account.`}
    >
      <form
        className="space-y-6"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        {auth.error && (
          <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-xs text-error">
            {auth.error}
          </div>
        )}

        <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-12 rounded-xl border border-outline-variant/70 bg-white text-center text-lg font-bold shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          ))}
        </div>

        <button
          disabled={auth.status === "loading" || otp.some((d) => d === "")}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d2d39] to-primary text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-60"
        >
          {auth.status === "loading" ? "Verifying..." : "Verify email"}
          <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-on-surface-variant">
        Didn't receive a code?{" "}
        <button
          type="button"
          disabled={resendCooldown > 0}
          onClick={handleResend}
          className="font-bold text-primary hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </p>
    </AuthLayout>
  );
}
