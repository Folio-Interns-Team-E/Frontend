// TopBar.tsx
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { markNotificationsRead } from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

import { toggleSidebar } from "../store/appSlice";

export function TopBar({ title }: { title: string }) {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.app.profile);
  const notifications = useAppSelector((state) => state.app.notifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => notification.unread).length;
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

      <div className="flex items-center gap-1 sm:gap-2">
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
         
        </Link>
      </div>
    </header>
  );
}
