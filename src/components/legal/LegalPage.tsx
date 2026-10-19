import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

type LegalPageProps = {
  title: string;
  description: string;
  effectiveDate: string;
  children: ReactNode;
};

export function LegalPage({ title, description, effectiveDate, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#182230]">
      <header className="border-b border-[#dfe3e8] bg-white">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8"
          aria-label="Legal page navigation"
        >
          <Link to="/" aria-label="SaleSync home">
            <img src="/logo-blue.png" alt="SaleSync" className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-[#475467]">
            <Link to="/privacy" className="hover:text-[#155eef]">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#155eef]">
              Terms
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-[#cfd5dd] bg-white px-4 py-2 text-[#344054] transition-colors hover:bg-[#f2f4f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155eef] focus-visible:ring-offset-2"
            >
              Log in
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8 lg:py-20">
        <aside className="h-fit rounded-lg border border-[#dfe3e8] bg-white p-5 lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667085]">Legal</p>
          <nav className="mt-4 flex flex-col gap-1" aria-label="Legal documents">
            <Link
              to="/privacy"
              activeProps={{ className: "bg-[#eff4ff] text-[#004eeb]" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-[#475467] hover:bg-[#f2f4f7]"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              activeProps={{ className: "bg-[#eff4ff] text-[#004eeb]" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-[#475467] hover:bg-[#f2f4f7]"
            >
              Terms of Service
            </Link>
          </nav>
        </aside>

        <article className="rounded-xl border border-[#dfe3e8] bg-white px-6 py-9 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:px-10 lg:px-14 lg:py-12">
          <header className="border-b border-[#e4e7ec] pb-8">
            <p className="text-sm font-semibold text-[#155eef]">SaleSync legal</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#101828]">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#475467]">{description}</p>
            <p className="mt-5 text-sm text-[#667085]">Effective date: {effectiveDate}</p>
          </header>
          <div className="legal-content mt-9 space-y-9 text-[15px] leading-7 text-[#344054]">
            {children}
          </div>
        </article>
      </main>

      <footer className="border-t border-[#dfe3e8] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-7 text-sm text-[#667085] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>&copy; {new Date().getFullYear()} SaleSync. All rights reserved.</span>
          <span>Questions? Contact us through your SaleSync workspace.</span>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold tracking-[-0.01em] text-[#101828]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export const legalListClass = "ml-5 list-disc space-y-2 marker:text-[#98a2b3]";
