import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { TopBar } from "../components/TopBar";
import { completeOnboarding } from "../store/appSlice";
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
  const [icp, setIcp] = useState(onboarding.icp);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!icp.trim()) return;
    dispatch(completeOnboarding({ icp }));
    void navigate({ to: "/" });
  }

  return (
    <>
      <TopBar title="Set up your AI sales team" />
      <div className="page-shell max-w-4xl">
        <div className="mb-8 rounded-2xl bg-primary px-8 py-7 text-white">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-fixed">
            Step 1 of 1
          </span>
          <h1 className="mt-2 text-3xl font-black">Define your Ideal Customer Profile.</h1>
          <p className="mt-2 max-w-2xl text-sm text-primary-fixed">
            Describe who you sell to. The assistant uses this to score leads and ground every
            recommendation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-xl border border-outline-variant bg-white p-6">
            <label className="block text-sm font-semibold">
              How would you describe your ideal customer?
              <textarea
                className="mt-2 w-full min-h-40 resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                value={icp}
                onChange={(event) => setIcp(event.target.value)}
                placeholder="e.g. B2B SaaS companies with 50-500 employees, where the Head of Sales or CRO is actively running outbound. They struggle with manual lead research and inconsistent proposal quality..."
              />
            </label>
            <p className="mt-2 text-xs text-on-surface-variant">
              Be specific about industry, company size, decision-maker roles, and their pain points.
              The more detail you provide, the better your lead scores will be.
            </p>
          </section>

          <button
            disabled={!icp.trim()}
            className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Save ICP
          </button>
        </form>
      </div>
    </>
  );
}
