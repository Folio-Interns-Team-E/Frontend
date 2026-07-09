import { configureStore } from "@reduxjs/toolkit";
import appReducer, { initialState as appInitialState } from "./appSlice";

const STORAGE_KEY = "salessync-ai-demo-state";

function loadState() {
  if (typeof window === "undefined") return undefined;
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    return serialized ? migrateState(JSON.parse(serialized)) : undefined;
  } catch {
    return undefined;
  }
}

function migrateState(savedState: unknown) {
  if (!savedState || typeof savedState !== "object" || !("app" in savedState)) {
    return undefined;
  }

  const savedApp = (savedState as { app?: Partial<typeof appInitialState> }).app ?? {};
  const savedProposals = Array.isArray(savedApp.proposals) ? savedApp.proposals : [];

  return {
    ...(savedState as object),
    app: {
      ...appInitialState,
      ...savedApp,
      auth: {
        ...appInitialState.auth,
        ...savedApp.auth,
        userTeams: [],
        userTeamsStatus: "idle" as const,
      },
      onboarding: {
        ...appInitialState.onboarding,
        ...savedApp.onboarding,
        icp: (() => {
          const icp: unknown = savedApp.onboarding?.icp;
          if (typeof icp === "string") return icp;
          if (Array.isArray(icp)) return icp.join(", ");
          return appInitialState.onboarding.icp;
        })(),
      },
      profile: { ...appInitialState.profile, ...savedApp.profile },
      integrations: { ...appInitialState.integrations, ...savedApp.integrations },
      team: { ...appInitialState.team, ...savedApp.team, status: "idle" as const },
      leadsStatus: "idle" as const,
      meetingsStatus: "idle" as const,
      proposalsStatus: "idle" as const,
      knowledgeAssetsStatus: "idle" as const,
      outreachLeadsStatus: "idle" as const,
      proposalTemplate: {
        ...appInitialState.proposalTemplate,
        ...savedApp.proposalTemplate,
      },
      notifications: Array.isArray(savedApp.notifications)
        ? savedApp.notifications
        : appInitialState.notifications,
      proposals: savedProposals.map((proposal) => ({
        ...proposal,
        outcome: proposal.outcome ?? "Open",
      })),
    },
  };
}

export const createAppStore = () => {
  const store = configureStore({
    reducer: {
      app: appReducer,
    },
    preloadedState: loadState(),
  });

  if (typeof window !== "undefined") {
    store.subscribe(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState()));
      } catch {
        // Ignore storage failures; the app still works for the active session.
      }
    });
  }

  return store;
};

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
