import { Link } from "@tanstack/react-router";
import { useId, type ReactNode } from "react";

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
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-slate-800 bg-[#111827] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/dashboard">
          <img src="/logo-white.png" alt="SaleSync AI" className="h-20 w-auto object-contain" />
        </Link>

        <div className="relative max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Multi-agent sales intelligence
          </div>
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-[-0.035em] xl:text-[44px]">
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
              <div key={label} className="rounded-md border border-slate-700 bg-slate-800/60 p-3.5">
                <span className="material-symbols-outlined text-[21px] text-blue-300">{icon}</span>
                <p className="mt-3 text-[11px] font-semibold leading-4 text-slate-200">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-[11px] text-slate-500">
          <span>© 2026 SaleSync AI</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>Built for modern B2B teams</span>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10">
        <div className="w-full max-w-[410px] rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/logo-blue.png" alt="SaleSync" className="h-9 w-auto" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-on-surface">
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
  const inputId = useId();

  return (
    <div className="block">
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-on-surface">
        <label htmlFor={inputId}>{label}</label>
        {action}
      </div>
      <input
        id={inputId}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        required
        className="h-12 w-full rounded-xl border border-outline-variant/70 bg-white px-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </div>
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
