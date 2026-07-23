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
import { closeSidebar, setActiveTeam, completeTeamSwitch, setIntegration } from "../store/appSlice";
import {
  fetchMyTeams,
  fetchOnboardingStatus,
  fetchLeads,
  fetchMeetings,
  fetchProposals,
  fetchKnowledgeAssets,
  fetchChatMessages,
  fetchChats,
} from "../store/apiThunks";
import { api } from "../lib/api";

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
  const teamSwitching = useAppSelector((state) => state.app.teamSwitching);
  const leadsStatus = useAppSelector((state) => state.app.leadsStatus);
  const meetingsStatus = useAppSelector((state) => state.app.meetingsStatus);
  const proposalsStatus = useAppSelector((state) => state.app.proposalsStatus);
  const knowledgeAssetsStatus = useAppSelector((state) => state.app.knowledgeAssetsStatus);
  const chatRefreshKey = useAppSelector((state) => state.app.chatRefreshKey);
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
      dispatch(fetchChats());
      api
        .getGmailStatus(accessToken)
        .then((res) => {
          dispatch(setIntegration({ integration: "gmail", value: res.data.connected }));
        })
        .catch(() => {});
    }
  }, [teamId, dispatch]);

  useEffect(() => {
    if (teamId && chatRefreshKey > 0) {
      dispatch(fetchLeads());
      dispatch(fetchMeetings());
      dispatch(fetchProposals());
      dispatch(fetchKnowledgeAssets());
    }
  }, [chatRefreshKey, teamId, dispatch]);

  useEffect(() => {
    if (
      teamSwitching &&
      leadsStatus !== "idle" &&
      meetingsStatus !== "idle" &&
      proposalsStatus !== "idle" &&
      knowledgeAssetsStatus !== "idle"
    ) {
      dispatch(completeTeamSwitch());
    }
  }, [teamSwitching, leadsStatus, meetingsStatus, proposalsStatus, knowledgeAssetsStatus, dispatch]);

  useEffect(() => {
    if (auth.userTeamsStatus !== "succeeded") return;
    const isOnTeamSetup = location.pathname === "/team-setup";
    if (auth.userTeams.length === 0 && !auth.teamChoiceCompleted && !isOnTeamSetup) {
      navigate({ to: "/team-setup" });
    } else if (!auth.teamChoiceCompleted && auth.userTeams.length > 0) {
      if (auth.userTeams.length === 1) {
        dispatch(setActiveTeam(auth.userTeams[0]));
        navigate({ to: "/dashboard" });
      } else if (!isOnTeamSetup) {
        navigate({ to: "/team-setup" });
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

  if (teamSwitching) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-on-surface-variant">Switching team...</p>
        </div>
      </div>
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


