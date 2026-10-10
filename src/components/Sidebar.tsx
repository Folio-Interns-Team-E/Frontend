import { Link } from "@tanstack/react-router";
import { useAppSelector } from "../store/hooks";

const navigation = [
  {
    label: "Command center",
    items: [{ to: "/dashboard", icon: "space_dashboard", label: "Overview" }],
  },
  {
    label: "Pipeline",
    items: [
      { to: "/lead-generation", icon: "person_search", label: "Prospects" },
      { to: "/qualification", icon: "verified", label: "Qualification" },
      { to: "/outreach", icon: "outgoing_mail", label: "Sequences" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { to: "/meetings", icon: "calendar_month", label: "Meetings" },
      { to: "/proposals", icon: "request_quote", label: "Proposals" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/knowledge-base", icon: "library_books", label: "Knowledge base" },
      { to: "/team", icon: "group", label: "Team" },
    ],
  },
] as const;

type SidebarProps = { onClose: () => void };

export function Sidebar({ onClose }: SidebarProps) {
  const team = useAppSelector((state) => state.app.team);
  const isAdmin = team.currentUserRole === "admin";
  const handleNavigate = () => {
    if (window.matchMedia("(max-width: 767px)").matches) onClose();
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col overflow-hidden border-r border-white/8 bg-[#081722] text-white shadow-2xl shadow-slate-950/25 md:z-30 md:w-[var(--spacing-sidebar_width)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="relative px-4 pb-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Link to="/dashboard" onClick={handleNavigate}>
            <img src="/logo-white.png" alt="SalesSync AI" className="h-10 w-auto object-contain" />
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">menu_open</span>
          </button>
        </div>
        <Link
          to="/team"
          onClick={handleNavigate}
          className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-2.5 transition hover:border-cyan-300/25 hover:bg-white/[0.07]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#168a94] to-[#0b5965] text-[11px] font-black">
            {(team.name || "SS").slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-bold text-slate-100">
              {team.name || "SalesSync workspace"}
            </span>
            <span className="block text-[9px] capitalize text-slate-500">
              {team.currentUserRole || "member"} workspace
            </span>
          </span>
          <span className="material-symbols-outlined text-[16px] text-slate-500">unfold_more</span>
        </Link>
      </div>

      <nav className="custom-scrollbar relative flex-1 overflow-y-auto px-2.5 pb-4">
        {isAdmin && (
          <div className="mb-3">
            <p className="px-3 pb-1.5 pt-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-600">
              Administration
            </p>
            <NavItem
              to="/admin"
              icon="admin_panel_settings"
              label="Admin console"
              onNavigate={handleNavigate}
            />
          </div>
        )}
        {navigation.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-3 pb-1.5 pt-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-600">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} onNavigate={handleNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-white/8 p-2.5">
        <div className="mb-2 grid grid-cols-2 gap-1">
          <Link
            to="/billing"
            onClick={handleNavigate}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-white"
          >
            <span className="material-symbols-outlined text-[17px]">credit_card</span>Billing
          </Link>
          <Link
            to="/settings"
            onClick={handleNavigate}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-white"
          >
            <span className="material-symbols-outlined text-[17px]">settings</span>Settings
          </Link>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-400/[0.06] px-3 py-2 text-[9px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.8)]" />
          Automation engine operational
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  to,
  icon,
  label,
  onNavigate,
}: {
  to: string;
  icon: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      activeOptions={{ exact: to === "/dashboard" }}
      className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[11px] font-medium text-slate-400 transition-all hover:bg-white/[0.055] hover:text-white"
      activeProps={{
        className:
          "group relative flex items-center gap-3 rounded-lg bg-cyan-300/[0.09] px-3 py-2 text-[11px] font-bold text-white ring-1 ring-inset ring-cyan-200/10 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-cyan-300",
      }}
    >
      <span className="material-symbols-outlined text-[18px] text-slate-500 transition-colors group-hover:text-cyan-300 group-aria-[current=page]:text-cyan-300">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
