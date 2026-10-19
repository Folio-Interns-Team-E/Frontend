import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { api, type BillingStatus } from "../lib/api";
import { useAppSelector } from "../store/hooks";
import { formatPkr, PLANS } from "../lib/plans";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({ meta: [{ title: "Billing · SaleSync AI" }] }),
  component: Billing,
});

function Billing() {
  const auth = useAppSelector((state) => state.app.auth);
  const token = auth.accessToken;
  const teamId = useAppSelector((state) => state.app.team.id);

  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !teamId) return;
    setLoading(true);
    api
      .getBillingStatus(token, teamId)
      .then((res) => setBilling(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load billing"))
      .finally(() => setLoading(false));
  }, [token, teamId]);

  const handleUpgrade = async (tier: "plus" | "pro") => {
    if (!token || !teamId) return;
    setCheckoutLoading(tier);
    try {
      const res = await api.createCheckoutSession(tier, token, teamId);
      window.location.href = res.data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setCheckoutLoading(null);
    }
  };

  const tierLabel = (tier: string) => {
    if (tier === "plus" || tier === "growth") return "Plus";
    if (tier === "pro" || tier === "enterprise") return "Pro";
    return "Free";
  };

  const tierColor = (tier: string) => {
    if (tier === "plus" || tier === "growth") return "text-blue-700 bg-blue-50 border-blue-200";
    if (tier === "pro" || tier === "enterprise")
      return "text-violet-700 bg-violet-50 border-violet-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  const statusColor = (status: string) => {
    if (status === "active") return "text-green-700 bg-green-50";
    if (status === "trialing") return "text-blue-700 bg-blue-50";
    if (status === "past_due") return "text-amber-700 bg-amber-50";
    if (status === "canceled" || status === "cancelled") return "text-red-700 bg-red-50";
    return "text-slate-600 bg-slate-50";
  };

  const plans = PLANS.filter(
    (plan): plan is (typeof PLANS)[number] & { tier: "plus" | "pro" } => plan.tier !== "free",
  );

  const usageLabels: Record<keyof NonNullable<BillingStatus["usage"]>, string> = {
    members: "Team members",
    leads: "Leads",
    ai_actions_monthly: "AI actions this month",
    emails_monthly: "Emails sent this month",
    active_sequences: "Active sequences",
    proposals_monthly: "Proposals this month",
  };

  return (
    <>
      <TopBar title="Billing" />
      <div className="page-shell max-w-5xl space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-3 font-semibold text-red-900 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Current Plan */}
        <section className="section-panel p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold">Current Plan</h2>
            <p className="text-sm text-on-surface-variant">
              Your active subscription and billing period.
            </p>
          </div>
          {loading ? (
            <div className="flex h-24 items-center justify-center">
              <span className="text-sm text-on-surface-variant">Loading subscription...</span>
            </div>
          ) : billing ? (
            <div className="flex flex-wrap items-center gap-5 sm:gap-6">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-1">Plan</p>
                <span
                  className={`inline-flex rounded-lg border px-3 py-1.5 text-sm font-bold ${tierColor(billing.tier)}`}
                >
                  {tierLabel(billing.tier)}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant mb-1">Status</p>
                <span
                  className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-bold ${statusColor(billing.status)}`}
                >
                  {billing.status}
                </span>
              </div>
              {billing.ends_at && (
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant mb-1">
                    Access until
                  </p>
                  <span className="text-sm font-semibold text-on-surface">
                    {new Date(billing.ends_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
              {billing.tier !== "free" && (
                <p className="w-full text-xs text-on-surface-variant sm:ml-auto sm:w-auto">
                  Manual renewal · no automatic charges
                </p>
              )}
            </div>
          ) : null}
        </section>

        {billing?.usage && billing?.limits && (
          <section className="section-panel p-5">
            <div className="mb-4">
              <h2 className="text-lg font-bold">Plan usage</h2>
              <p className="text-sm text-on-surface-variant">
                Workspace usage against your current limits.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(usageLabels) as Array<keyof BillingStatus["usage"]>).map((key) => {
                const used = billing.usage[key];
                const limit = billing.limits[key];
                const percentage = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
                return (
                  <div key={key}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="font-medium text-on-surface">{usageLabels[key]}</span>
                      <span className="tabular-nums text-on-surface-variant">
                        {used.toLocaleString()} / {limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded bg-slate-100">
                      <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Upgrade Plans */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold">Upgrade Your Plan</h2>
            <p className="text-sm text-on-surface-variant">
              Pay securely for 30 days of access. No Safepay account or automatic renewal required.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {plans.map((plan) => {
              const isCurrent = billing?.tier === plan.tier;
              const isLoading = checkoutLoading === plan.tier;
              return (
                <div
                  key={plan.tier}
                  className={`app-card app-card-hover relative overflow-hidden p-6 ${
                    isCurrent ? "ring-2 ring-primary/60" : ""
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      CURRENT
                    </span>
                  )}
                  <h3 className="text-xl font-extrabold">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black">{formatPkr(plan.price)}</span>
                    <span className="text-sm text-on-surface-variant">/ 30 days</span>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-on-surface">
                        <span className="material-symbols-outlined mt-0.5 text-[16px] text-primary">
                          check_circle
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={isCurrent || isLoading || loading}
                    className={`mt-6 w-full ${
                      isCurrent
                        ? "secondary-action cursor-not-allowed text-slate-400"
                        : "primary-action"
                    }`}
                  >
                    {isCurrent
                      ? "Current plan"
                      : isLoading
                        ? "Redirecting to checkout..."
                        : `Buy ${plan.name} for 30 days`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
