import { Link } from "@tanstack/react-router";

const navItems = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/lead-generation", icon: "person_add", label: "Lead Generation" },
  { to: "/qualification", icon: "verified", label: "Qualification" },
  { to: "/outreach", icon: "campaign", label: "Outreach" },
  { to: "/meetings", icon: "calendar_today", label: "Meetings" },
  { to: "/proposals", icon: "description", label: "Proposals" },
  { to: "/knowledge-base", icon: "database", label: "Knowledge Base" },
  { to: "/team", icon: "groups_2", label: "Team" },
] as const;

type SidebarProps = {
  onClose: () => void;
};

export function Sidebar({ onClose }: SidebarProps) {
  const handleNavigate = () => {
    if (window.matchMedia("(max-width: 767px)").matches) onClose();
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col overflow-y-auto overflow-x-hidden border-r border-white/8 bg-[#0b1724] text-white shadow-2xl shadow-slate-950/25 md:z-30 md:w-[var(--spacing-sidebar_width)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="relative mb-4 px-4 pt-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">menu_open</span>
          </button>
          <Link to="/dashboard">
            <img src="/logo-white.png" alt="SalesSync AI" className="h-12 w-auto object-contain" />
          </Link>
        </div>
      </div>
      <div className="relative px-4 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
        Workspace
      </div>
      <nav className="relative flex-1 space-y-1 px-2.5 pb-4">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={handleNavigate}
            activeOptions={{ exact: item.to === "/dashboard" }}
            className="group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium text-slate-400 transition-all hover:bg-white/[0.055] hover:text-white"
            activeProps={{
              className:
                "group relative flex cursor-pointer items-center gap-3 rounded-lg bg-primary/14 px-3 py-2.5 text-[12px] font-semibold text-white ring-1 ring-inset ring-primary/24 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-[#5ee5e7]",
            }}
          >
            <span className="material-symbols-outlined text-[19px] text-slate-400 transition-colors group-hover:text-[#78dde0] group-aria-[current=page]:text-[#78dde0]">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="relative border-t border-white/8 px-2.5 pt-3">
        <Link
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          to="/billing"
          onClick={handleNavigate}
          activeProps={{
            className:
              "flex cursor-pointer items-center gap-2.5 rounded-xl bg-white/[0.08] px-3 py-2.5 text-[12px] font-semibold text-white",
          }}
        >
          <span className="material-symbols-outlined text-[19px]">credit_card</span>
          <span>Billing</span>
        </Link>
      </div>
      <div className="relative mb-3 px-2.5">
        <Link
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          to="/settings"
          onClick={handleNavigate}
          activeProps={{
            className:
              "flex cursor-pointer items-center gap-2.5 rounded-xl bg-white/[0.08] px-3 py-2.5 text-[12px] font-semibold text-white",
          }}
        >
          <span className="material-symbols-outlined text-[19px]">settings</span>
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
