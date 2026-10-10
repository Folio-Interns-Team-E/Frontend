// TopBar.tsx
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { api, NotificationApi, SearchResultApi } from "../lib/api";

import { toggleSidebar } from "../store/appSlice";

export function TopBar({ title }: { title: string }) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.app.profile);
  const team = useAppSelector((state) => state.app.team);
  const [notifications, setNotifications] = useState<NotificationApi[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultApi[]>([]);
  const accessToken = useAppSelector((state) => state.app.auth.accessToken);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const sidebarOpen = useAppSelector((state) => state.app.sidebarOpen);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        notificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(target) &&
        notificationsButtonRef.current &&
        !notificationsButtonRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        helpOpen &&
        helpRef.current &&
        !helpRef.current.contains(target) &&
        helpButtonRef.current &&
        !helpButtonRef.current.contains(target)
      ) {
        setHelpOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsOpen, helpOpen]);

  useEffect(() => {
    if (search.trim().length < 2 || !accessToken || !team.id) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      api
        .searchWorkspace(search.trim(), accessToken, team.id)
        .then((result) => setSearchResults(result.data))
        .catch(() => setSearchResults([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, accessToken, team.id]);

  useEffect(() => {
    if (!accessToken || !team.id) {
      setNotifications([]);
      return;
    }
    const loadNotifications = () => {
      api
        .getNotifications(accessToken, team.id!)
        .then((response) => setNotifications(response.data))
        .catch(() => {});
    };
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60_000);
    return () => window.clearInterval(timer);
  }, [accessToken, team.id]);

  async function openNotifications() {
    const opening = !notificationsOpen;
    setNotificationsOpen(opening);
    setHelpOpen(false);
    if (opening && unreadCount && accessToken && team.id) {
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      try {
        await api.markAllNotificationsRead(accessToken, team.id);
      } catch {
        const response = await api.getNotifications(accessToken, team.id).catch(() => null);
        if (response) setNotifications(response.data);
      }
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-outline-variant/35 bg-white/95 px-4 shadow-[0_1px_8px_rgba(15,23,42,0.025)] backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-1">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="icon-button shrink-0"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <span className="material-symbols-outlined">menu_open</span>
          ) : (
            <span className="material-symbols-outlined">menu</span>
          )}
        </button>

        <div className="min-w-0 border-l border-outline-variant/45 pl-3">
          <p className="hidden text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:block">
            Workspace
          </p>
          <h2 className="truncate text-[17px] font-extrabold tracking-[-0.02em] text-on-surface sm:text-[18px]">
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <label className="control relative hidden h-9 min-h-0 w-[220px] items-center gap-2 px-3 lg:flex">
          <span className="material-symbols-outlined text-[17px] text-slate-400">search</span>
          <input
            type="search"
            aria-label="Search workspace"
            placeholder="Search leads, accounts..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[11px] font-medium outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-bold text-slate-400">
            ⌘ K
          </kbd>
          {search.trim().length >= 2 && (
            <div className="absolute left-0 top-11 z-50 w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-2xl">
              {searchResults.length ? (
                searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => {
                      window.location.assign(result.url);
                      setSearch("");
                    }}
                    className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-[9px] font-black text-primary">
                      {result.type.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-bold text-slate-800">
                        {result.title}
                      </span>
                      <span className="block truncate text-[9px] text-slate-400">
                        {result.type} · {result.subtitle}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-4 py-5 text-center text-[10px] text-slate-400">
                  No matching workspace records
                </p>
              )}
            </div>
          )}
        </label>
        <Link
          to="/lead-generation"
          className="hidden h-9 items-center gap-1.5 rounded-lg bg-[#0d2d39] px-3 text-[11px] font-bold text-white shadow-sm transition hover:bg-primary sm:flex"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New prospect
        </Link>
        <button
          ref={notificationsButtonRef}
          onClick={() => void openNotifications()}
          className="icon-button relative"
          aria-label="Open notifications"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-black text-white">
              {unreadCount}
            </span>
          )}
        </button>
        {notificationsOpen && (
          <div
            ref={notificationsRef}
            className="absolute right-3 top-[58px] w-[calc(100vw-1.5rem)] max-w-[360px] overflow-hidden rounded-xl border border-outline-variant/55 bg-white shadow-2xl shadow-slate-900/15 sm:right-20"
          >
            <div className="border-b border-outline-variant/50 px-5 py-4">
              <p className="text-sm font-extrabold">Notifications</p>
              <p className="text-[10px] text-on-surface-variant">Workspace activity</p>
            </div>
            {notifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <span className="material-symbols-outlined text-3xl text-slate-300">
                  notifications_none
                </span>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  You&apos;re all caught up.
                </p>
              </div>
            ) : (
              <div className="max-h-[360px] divide-y divide-outline-variant/50 overflow-y-auto">
                {notifications.slice(0, 8).map((notification) => (
                  <Link
                    key={notification.id}
                    to={(notification.link || "/dashboard") as "/dashboard"}
                    onClick={() => setNotificationsOpen(false)}
                    className="block px-5 py-4 hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-[17px]">
                          {!notification.is_read ? "notifications_active" : "task_alt"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold">{notification.title}</p>
                        <p className="mt-1 text-[11px] leading-4 text-on-surface-variant">
                          {notification.body}
                        </p>
                        <p className="mt-2 text-[10px] font-semibold text-slate-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <Link
          to="/settings"
          className="ml-1 hidden items-center gap-2 border-l border-outline-variant/45 pl-3 sm:flex"
          aria-label="Open profile settings"
        >
          <span className="flex h-8 w-8 items-center pt-[3px] justify-center rounded-lg bg-[#0d2d39] text-[10px] font-extrabold text-white">
            {(profile.name || "User")
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <span className="hidden min-w-0 xl:block">
            <span className="block max-w-28 truncate text-[10px] font-bold text-slate-700">
              {profile.name || "Sales user"}
            </span>
            <span className="block max-w-28 truncate text-[8px] capitalize text-slate-400">
              {team.currentUserRole || "member"}
            </span>
          </span>
          <span className="material-symbols-outlined hidden text-[15px] text-slate-400 xl:block">
            expand_more
          </span>
        </Link>
      </div>
    </header>
  );
}
