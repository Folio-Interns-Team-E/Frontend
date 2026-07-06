import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-[#f4f7fb] lg:grid-cols-[1fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#0b1724] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 -top-24 h-96 w-96 rounded-full bg-primary/25 blur-[100px]" />
        <div className="absolute -bottom-32 right-[-80px] h-[28rem] w-[28rem] rounded-full bg-cyan-400/15 blur-[110px]" />
        <div className="absolute right-16 top-36 h-56 w-56 rounded-full border border-white/[0.06]" />
        <div className="absolute right-28 top-48 h-32 w-32 rounded-full border border-white/[0.06]" />

        <Link to="/dashboard">
          <img
            src="/logo-white.png"
            alt="SalesSync AI"
            className="h-25 w-auto rounded-xl object-contain"
          />
        </Link>

        <div className="relative max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#72e1e3]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#72e1e3]" />
            Multi-agent sales intelligence
          </div>
          <h1 className="text-4xl font-black leading-[1.12] tracking-[-0.04em] xl:text-[46px]">
            Turn every sales conversation into momentum.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-300">
            One intelligent workspace for ICP-driven prospecting, personalized outreach, meeting
            intelligence, and source-grounded proposals.
          </p>

          <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">
            {[
              ["person_search", "ICP-matched leads"],
              ["record_voice_over", "Meeting context"],
              ["description", "Grounded proposals"],
            ].map(([icon, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-3.5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.075]"
              >
                <span className="material-symbols-outlined text-[21px] text-[#72e1e3]">{icon}</span>
                <p className="mt-3 text-[11px] font-semibold leading-4 text-slate-200">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-[11px] text-slate-500">
          <span>© 2026 SalesSync AI</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>Built for modern B2B teams</span>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:px-10">
        <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="relative w-full max-w-[410px] rounded-[1.5rem] border border-white/70 bg-white/58 p-6 shadow-2xl shadow-slate-900/8 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d1f2d] to-primary text-white">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <span className="font-extrabold">SalesSync AI</span>
          </div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-[28px] font-black tracking-[-0.035em] text-on-surface">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
      </section>
    </main>
  );
}

export function AuthField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  action,
}: {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  action?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-bold text-on-surface">
        {label}
        {action}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        required
        className="h-12 w-full rounded-xl border border-outline-variant/70 bg-white px-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

type GoogleButtonProps = {
  label: string;
  onClick?: () => void;
};

export function GoogleButton({ label, onClick }: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/70 bg-white text-sm font-bold text-on-surface shadow-sm transition hover:border-primary/30 hover:bg-slate-50"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[15px] font-black text-[#4285f4] shadow-sm">
        G
      </span>
      {label}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-outline-variant/60" />
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        or continue with email
      </span>
      <div className="h-px flex-1 bg-outline-variant/60" />
    </div>
  );
}
