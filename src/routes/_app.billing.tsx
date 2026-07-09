import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { api, type BillingStatus } from "../lib/api";
import { useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({ meta: [{ title: "Billing · SalesSync AI" }] }),
  component: Billing,
});

function Billing() {
  const auth = useAppSelector((state) => state.app.auth);
  const token = auth.accessToken ?? localStorage.getItem("access_token");

  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .getBillingStatus(token)
      .then((res) => setBilling(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load billing"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleUpgrade = async (tier: "growth" | "enterprise") => {
    if (!token) return;
    setCheckoutLoading(tier);
    try {
      const res = await api.createCheckoutSession(tier, token);
      window.location.href = res.data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setCheckoutLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!token) return;
    setCancelling(true);
    try {
      await api.cancelSubscription(token);
      const res = await api.getBillingStatus(token);
      setBilling(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setCancelling(false);
    }
  };

  const tierLabel = (tier: string) => {
    if (tier === "growth") return "Growth";
    if (tier === "enterprise") return "Enterprise";
    return "Free";
  };

  const tierColor = (tier: string) => {
    if (tier === "growth") return "text-cyan-700 bg-cyan-50 border-cyan-200";
    if (tier === "enterprise") return "text-violet-700 bg-violet-50 border-violet-200";
    return "text-slate-600 bg-slate-50 border-slate-200";
  };

  const statusColor = (status: string) => {
    if (status === "active") return "text-green-700 bg-green-50";
    if (status === "trialing") return "text-blue-700 bg-blue-50";
    if (status === "past_due") return "text-amber-700 bg-amber-50";
    if (status === "canceled" || status === "cancelled") return "text-red-700 bg-red-50";
    return "text-slate-600 bg-slate-50";
  };

  const plans = [
    {
      tier: "growth" as const,
      name: "Growth",
      price: "$49",
      period: "/mo",
      features: [
        "Up to 500 leads/month",
        "AI email drafting & outreach",
        "Meeting transcription",
        "Priority support",
      ],
    },
    {
      tier: "enterprise" as const,
      name: "Enterprise",
      price: "$199",
      period: "/mo",
      features: [
        "Unlimited leads",
        "Custom AI training on your data",
        "Team analytics dashboard",
        "Dedicated account manager",
        "SSO & advanced security",
      ],
    },
  ];

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
        <section className="rounded-xl border border-outline-variant bg-white p-6">
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
            <div className="flex flex-wrap items-center gap-6">
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
                    {billing.cancel_at_period_end ? "Cancels on" : "Renews on"}
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
                <div className="ml-auto">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling || billing.cancel_at_period_end}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {billing.cancel_at_period_end
                      ? "Cancellation scheduled"
                      : cancelling
                        ? "Cancelling..."
                        : "Cancel subscription"}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </section>

        {/* Upgrade Plans */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold">Upgrade Your Plan</h2>
            <p className="text-sm text-on-surface-variant">
              Choose a plan that fits your team's needs.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {plans.map((plan) => {
              const isCurrent = billing?.tier === plan.tier;
              const isLoading = checkoutLoading === plan.tier;
              return (
                <div
                  key={plan.tier}
                  className={`app-card relative overflow-hidden p-6 transition-all ${
                    isCurrent ? "ring-2 ring-primary" : "hover:shadow-lg"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      CURRENT
                    </span>
                  )}
                  <h3 className="text-xl font-extrabold">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black">{plan.price}</span>
                    <span className="text-sm text-on-surface-variant">{plan.period}</span>
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
                    className={`mt-6 w-full rounded-lg py-2.5 text-sm font-bold transition ${
                      isCurrent
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-primary text-white hover:brightness-110"
                    }`}
                  >
                    {isCurrent
                      ? "Current plan"
                      : isLoading
                        ? "Redirecting to checkout..."
                        : `Upgrade to ${plan.name}`}
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
