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
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-full md:w-[var(--spacing-sidebar_width)] flex-col  border-r border-white/10 bg-[#0b1724] overflow-y-auto overflow-x-hidden scrollbar-none text-white shadow-2xl shadow-slate-950/20">
      <div className="absolute -left-16 -top-12 h-44 w-44 rounded-full bg-primary/25 blur-3xl" />
      <div className="absolute bottom-20 right-[-90px] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative mb-5 px-4 pt-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className=" md:hidden rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">menu_open</span>
          </button>
          <Link to="/dashboard">
            <img
              src="/logo-white.png"
              alt="SalesSync AI"
              className="h-15 w-auto rounded-xl object-contain"
            />
          </Link>
        </div>
      </div>
      <div className="relative px-4 pb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
        Workspace
      </div>
      <nav className="relative flex-1 space-y-1 px-2.5">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/dashboard" }}
            className="group flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-medium text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white"
            activeProps={{
              className:
                "group flex cursor-pointer items-center gap-2.5 rounded-xl bg-gradient-to-r from-primary/32 to-white/[0.045] px-3 py-2.5 text-[12px] font-semibold text-white shadow-inner shadow-white/5 ring-1 ring-primary/25",
            }}
          >
            <span className="material-symbols-outlined text-[19px] text-slate-400 transition-colors group-hover:text-[#5ee5e7]">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="relative mb-1 px-2.5">
        <Link
          className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          to="/billing"
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
          className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          to="/settings"
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
