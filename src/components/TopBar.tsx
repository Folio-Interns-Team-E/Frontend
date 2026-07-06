// TopBar.tsx
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { markNotificationsRead } from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

import { closeSidebar, openSidebar, toggleSidebar } from "../store/appSlice";

export function TopBar({ title }: { title: string }) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.app.profile);
  const notifications = useAppSelector((state) => state.app.notifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const sidebarOpen = useAppSelector((state) => state.app.sidebarOpen);
  const suggestions = [
    "Dashboard",
    "Lead Generation",
    "Qualification",
    "Outreach",
    "Meetings",
    "Proposals",
    "Knowledge Base",
    "Team",
    "Settings",
  ].filter((item) => item.toLowerCase().includes(workspaceSearch.toLowerCase()));

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

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-white/70 bg-white px-5 backdrop-blur-2xl">
      <div className="flex flex-row items-center justify-center ">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="flex items-center justify-center rounded-lg p-2 mb-1 text-slate-400 transition  hover:bg-white/10 hover:text-black"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <span className="material-symbols-outlined">menu_open</span>
          ) : (
            <span className="material-symbols-outlined">menu</span>
          )}
        </button>

        <h2 className="text-[19px] font-black tracking-tight text-primary">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          ref={notificationsButtonRef}
          onClick={() => {
            setNotificationsOpen((open) => !open);
            setHelpOpen(false);
            if (!notificationsOpen) dispatch(markNotificationsRead());
          }}
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
            className="absolute right-20 top-[58px] w-[340px] overflow-hidden rounded-2xl border border-outline-variant/60 bg-white shadow-2xl shadow-slate-900/15"
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
                  <div key={notification.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-[17px]">
                          {notification.unread ? "notifications_active" : "task_alt"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold">{notification.title}</p>
                        <p className="mt-1 text-[11px] leading-4 text-on-surface-variant">
                          {notification.body}
                        </p>
                        <p className="mt-2 text-[10px] font-semibold text-slate-400">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          ref={helpButtonRef}
          className="icon-button"
          onClick={() => {
            setHelpOpen((open) => !open);
            setNotificationsOpen(false);
          }}
          aria-label="Open help"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
        </button>
        {helpOpen && (
          <div
            ref={helpRef}
            className="absolute right-16 top-[58px] z-30 w-[300px] rounded-2xl border border-outline-variant/60 bg-white p-5 shadow-2xl shadow-slate-900/15"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">info</span>
              <p className="text-sm font-extrabold">SalesSync AI help</p>
            </div>
            <p className="text-xs leading-5 text-on-surface-variant">
              This is a frontend demo workspace. Use the sidebar to review leads, proposals,
              meetings, team flows, and settings. The AI panel can be collapsed from its header.
            </p>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="mt-4 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
