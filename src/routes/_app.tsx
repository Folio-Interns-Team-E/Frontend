import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { AIChatPanel } from "../components/AIChatPanel";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { closeSidebar, setActiveTeam } from "../store/appSlice";
import {
  fetchMyTeams,
  fetchOnboardingStatus,
  fetchLeads,
  fetchMeetings,
  fetchProposals,
  fetchKnowledgeAssets,
} from "../store/apiThunks";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ context, location }) => {
    // Browser storage is unavailable during SSR. Deferring the check keeps a
    // persisted session from being redirected before the client hydrates it.
    if (typeof window === "undefined") return;

    // Access Redux state directly from the router context
    const state = context.store.getState();
    const auth = state.app.auth;

    // Rule 1: Redirect to login if unauthenticated
    if (!auth.loggedIn && !localStorage.getItem("access_token")) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarOpen = useAppSelector((state) => state.app.sidebarOpen);
  const auth = useAppSelector((state) => state.app.auth);
  const teamId = useAppSelector((state) => state.app.team.id);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const accessToken =
    auth.accessToken ??
    (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);

  useEffect(() => {
    if (window.matchMedia("(min-width: 1280px)").matches) {
      setAiPanelOpen(true);
    }
    if (window.matchMedia("(max-width: 767px)").matches) {
      dispatch(closeSidebar());
    }
  }, [dispatch]);

  useEffect(() => {
    if (typeof window === "undefined" || auth.loggedIn || accessToken) return;
    void navigate({ to: "/login", search: { redirect: location.href }, replace: true });
  }, [accessToken, auth.loggedIn, location.href, navigate]);

  useEffect(() => {
    const token = accessToken && accessToken !== "undefined" ? accessToken : null;
    if (token && auth.userTeamsStatus === "idle") {
      dispatch(fetchMyTeams(token));
    }
  }, [accessToken, auth.userTeamsStatus, dispatch]);

  useEffect(() => {
    if (teamId) {
      dispatch(fetchOnboardingStatus());
      dispatch(fetchLeads());
      dispatch(fetchMeetings());
      dispatch(fetchProposals());
      dispatch(fetchKnowledgeAssets());
    }
  }, [teamId, dispatch]);

  useEffect(() => {
    if (auth.userTeamsStatus !== "succeeded") return;
    const isOnTeamSetup = location.pathname === "/team-setup";
    if (auth.userTeams.length === 0 && !isOnTeamSetup) {
      navigate({ to: "/team-setup" });
    } else if (!auth.teamChoiceCompleted && auth.userTeams.length > 0) {
      if (auth.userTeams.length === 1) {
        dispatch(setActiveTeam(auth.userTeams[0]));
        navigate({ to: "/dashboard" });
      }
    }
  }, [
    auth.userTeamsStatus,
    auth.userTeams,
    auth.teamChoiceCompleted,
    navigate,
    dispatch,
    location.pathname,
  ]);

  if (auth.userTeamsStatus === "idle" || auth.userTeamsStatus === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-on-surface-variant">Loading your teams...</p>
        </div>
      </div>
    );
  }

  if (!auth.loggedIn && !accessToken) return null;

  if (
    auth.userTeamsStatus === "succeeded" &&
    auth.userTeams.length > 0 &&
    !auth.teamChoiceCompleted
  ) {
    return (
      <TeamSelector
        teams={auth.userTeams}
        onSelect={(team) => {
          dispatch(setActiveTeam(team));
          navigate({ to: "/dashboard" });
        }}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-on-surface">
      {sidebarOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[#0b1724]/45 backdrop-blur-[2px] md:hidden"
            onClick={() => dispatch(closeSidebar())}
            aria-label="Close navigation"
          />
          <Sidebar onClose={() => dispatch(closeSidebar())} />
        </>
      )}

      <main
        className={`min-w-0 flex-1 overflow-y-auto bg-transparent transition-[margin] duration-200 ${
          sidebarOpen ? "md:ml-[var(--spacing-sidebar_width)]" : "ml-0"
        } ${aiPanelOpen ? "xl:mr-[var(--spacing-ai_panel_width)]" : "mr-0"}`}
      >
        <Outlet />
      </main>

      {aiPanelOpen ? (
        <AIChatPanel onClose={() => setAiPanelOpen(false)} />
      ) : (
        <button
          onClick={() => setAiPanelOpen(true)}
          className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#0d2d39] text-xs font-black text-white shadow-xl shadow-slate-900/20 transition hover:-translate-y-1 hover:bg-primary"
          aria-label="Open sales copilot"
        >
          <img src="/robot.png" alt="" className="h-7 w-7 object-contain" />
        </button>
      )}
    </div>
  );
}

function TeamSelector({
  teams,
  onSelect,
}: {
  teams: { id: string; name: string; role: string }[];
  onSelect: (team: { id: string; name: string; role: "admin" | "manager" | "rep" }) => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-5">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d1f2d] to-primary text-white shadow-lg">
            <span className="material-symbols-outlined text-[24px]">groups</span>
          </div>
          <h1 className="text-2xl font-black tracking-[-0.03em] text-on-surface">Choose a team</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            You are a member of multiple teams. Select which one to manage.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() =>
                onSelect(team as { id: string; name: string; role: "admin" | "manager" | "rep" })
              }
              className="app-card app-card-hover flex items-center gap-4 p-5 text-left"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[22px]">apartment</span>
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-on-surface">{team.name}</p>
                <p className="mt-0.5 text-xs capitalize text-on-surface-variant">
                  Your role: {team.role}
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">
                arrow_forward_ios
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
