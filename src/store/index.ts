import { configureStore } from "@reduxjs/toolkit";
import appReducer, { initialState as appInitialState } from "./appSlice";

const LEGACY_STORAGE_KEY = "salessync-ai-demo-state";
const UI_STORAGE_KEY = "salessync-ui-preferences";

function loadState() {
  if (typeof window === "undefined") return undefined;
  try {
    // Older releases stored account and workspace data in a browser-wide key.
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    const serialized = window.localStorage.getItem(UI_STORAGE_KEY);
    if (!serialized) return undefined;
    const preferences: unknown = JSON.parse(serialized);
    if (!preferences || typeof preferences !== "object" ||
        !("sidebarOpen" in preferences) || typeof preferences.sidebarOpen !== "boolean") {
      return undefined;
    }
    return { app: { ...appInitialState, sidebarOpen: preferences.sidebarOpen } };
  } catch {
    return undefined;
  }
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
        window.localStorage.setItem(
          UI_STORAGE_KEY,
          JSON.stringify({ sidebarOpen: store.getState().app.sidebarOpen }),
        );
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
