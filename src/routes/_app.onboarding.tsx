import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { fetchOnboardingStatus, submitOnboardingRemote } from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [{ title: "Set up your sales copilot · SalesSync AI" }],
  }),
  component: Onboarding,
});

function Onboarding() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const onboarding = useAppSelector((state) => state.app.onboarding);
  const team = useAppSelector((state) => state.app.team);
  const [icp, setIcp] = useState(onboarding.icp);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const userEditedRef = useRef(false);

  // Always pull the true current ICP from the server when this page opens,
  // rather than trusting whatever happened to be in local state — that gap
  // is what let a stale textarea overwrite newer saved edits.
  useEffect(() => {
    if (!team.id) return;
    let cancelled = false;
    void dispatch(fetchOnboardingStatus()).finally(() => {
      if (!cancelled) setLoadingLatest(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id]);

  // Keep the textarea in sync with the freshly-fetched value until the user
  // actually starts typing, so we never save on top of a stale baseline.
  useEffect(() => {
    if (!userEditedRef.current) setIcp(onboarding.icp);
  }, [onboarding.icp]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = icp.trim();
    if (!text || saving || loadingLatest) return;
    setSaving(true);
    setError(null);
    const result = await dispatch(submitOnboardingRemote({ icp: text }));
    setSaving(false);
    if (submitOnboardingRemote.fulfilled.match(result)) {
      void navigate({ to: "/" });
    } else {
      setError(
        typeof result.payload === "string"
          ? result.payload
          : "Couldn't save your ICP. Please try again.",
      );
    }
  }

  return (
    <>
      <TopBar title="Set up your AI sales team" />
      <div className="page-shell max-w-4xl">
        <div className="subtle-grid mb-6 rounded-2xl bg-[#0d2935] px-5 py-6 text-white sm:mb-8 sm:px-8 sm:py-7">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-fixed">
            Step 1 of 1
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
            Define your Ideal Customer Profile.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-primary-fixed">
            Describe who you sell to. The assistant uses this to score leads and ground every
            recommendation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="section-panel p-5 sm:p-6">
            <label className="block text-sm font-semibold">
              How would you describe your ideal customer?
              <textarea
                className="control mt-2 min-h-40 w-full resize-y px-4 py-3 text-sm outline-none disabled:opacity-60"
                value={icp}
                disabled={loadingLatest}
                onChange={(event) => {
                  userEditedRef.current = true;
                  setIcp(event.target.value);
                }}
                placeholder={
                  loadingLatest
                    ? "Loading your current ICP..."
                    : "e.g. B2B SaaS companies with 50-500 employees, where the Head of Sales or CRO is actively running outbound. They struggle with manual lead research and inconsistent proposal quality..."
                }
              />
            </label>
            <p className="mt-2 text-xs text-on-surface-variant">
              Be specific about industry, company size, decision-maker roles, and their pain points.
              The more detail you provide, the better your lead scores will be.
            </p>
          </section>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          <button
            disabled={!icp.trim() || saving || loadingLatest}
            className="primary-action w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingLatest ? "Loading..." : saving ? "Saving..." : "Save ICP"}
          </button>
        </form>
      </div>
    </>
  );
}