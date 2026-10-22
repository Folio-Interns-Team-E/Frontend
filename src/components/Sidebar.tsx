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
      { to: "/crm", icon: "domain", label: "Accounts & Contacts" },
      { to: "/lead-generation", icon: "person_search", label: "Prospects" },
      { to: "/qualification", icon: "verified", label: "Qualification" },
      { to: "/sequences", icon: "conversion_path", label: "Sequences" },
      { to: "/outreach", icon: "outgoing_mail", label: "Email studio" },
    ],
  },
  {
    label: "Revenue",
    items: [
      { to: "/deals", icon: "handshake", label: "Deals" },
      { to: "/financials", icon: "monitoring", label: "Financials" },
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
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col overflow-hidden border-r border-slate-800 bg-[#111827] text-white md:z-30 md:w-[var(--spacing-sidebar_width)]">
      <div className="relative border-b border-slate-800 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/dashboard" onClick={handleNavigate}>
            <img src="/logo-white.png" alt="SaleSync AI" className="h-7 w-auto object-contain" />
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
          className="mt-3 flex items-center gap-2 rounded border border-slate-700 bg-slate-800/60 p-2 transition-colors hover:border-slate-600 hover:bg-slate-800"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-blue-600 text-[10px] font-semibold">
            {(team.name || "SS").slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-slate-100">
              {team.name || "SaleSync workspace"}
            </span>
            <span className="block text-[10px] capitalize text-slate-400">
              {team.currentUserRole || "member"} workspace
            </span>
          </span>
          <span className="material-symbols-outlined text-[16px] text-slate-500">unfold_more</span>
        </Link>
      </div>

      <nav className="custom-scrollbar relative flex-1 overflow-y-auto px-2 pb-3 pt-1">
        {isAdmin && (
          <div className="mb-2">
            <p className="px-2 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
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
          <div key={group.label} className="mb-2">
            <p className="px-2 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
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

      <div className="relative border-t border-white/8 p-2">
        <div className="mb-1.5 grid grid-cols-2 gap-1">
          <Link
            to="/billing"
            onClick={handleNavigate}
            className="flex items-center gap-1.5 rounded px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-white"
          >
            <span className="material-symbols-outlined text-[17px]">credit_card</span>Billing
          </Link>
          <Link
            to="/settings"
            onClick={handleNavigate}
            className="flex items-center gap-1.5 rounded px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-white"
          >
            <span className="material-symbols-outlined text-[17px]">settings</span>Settings
          </Link>
        </div>
        <div className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-[9px] font-medium text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
      className="group relative flex items-center gap-2 rounded px-2 py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
      activeProps={{
        className:
          "group relative flex items-center gap-2 rounded bg-slate-800 px-2 py-1.5 text-[11px] font-semibold text-white before:absolute before:bottom-1 before:left-0 before:top-1 before:w-0.5 before:bg-blue-500",
      }}
    >
      <span className="material-symbols-outlined text-[16px] text-slate-500 transition-colors group-hover:text-blue-400 group-aria-[current=page]:text-blue-400">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
