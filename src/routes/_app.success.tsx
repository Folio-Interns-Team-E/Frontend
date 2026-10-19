import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type BillingStatus } from "../lib/api";
import { useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/success")({
  head: () => ({ meta: [{ title: "Payment Successful · SalesSync AI" }] }),
  component: BillingSuccess,
});

function BillingSuccess() {
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.app.auth);
  const token = auth.accessToken;
  const teamId = useAppSelector((state) => state.app.team.id);

  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!token || !teamId) {
      setProcessing(false);
      setError("Missing workspace information. Redirecting to billing...");
      setTimeout(() => navigate({ to: "/billing" }), 2000);
      return;
    }

    let cancelled = false;
    const confirmFromWebhook = async () => {
      // Safepay redirects are UI-only. The signed webhook is authoritative, so allow
      // a few seconds for it to update the workspace before showing the result.
      for (let attempt = 0; attempt < 10 && !cancelled; attempt += 1) {
        try {
          const res = await api.getBillingStatus(token, teamId);
          if (res.data.tier !== "free" && res.data.status === "active") {
            setBilling(res.data);
            setProcessing(false);
            setTimeout(() => navigate({ to: "/billing" }), 3000);
            return;
          }
        } catch {
          // Retry while Safepay's webhook is in flight.
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      if (!cancelled) {
        setError("Payment is still being confirmed. Check Billing again in a moment.");
        setProcessing(false);
      }
    };
    void confirmFromWebhook();
    return () => {
      cancelled = true;
    };
  }, [token, teamId, navigate]);

  const tierLabel = (tier: string) => {
    if (tier === "plus" || tier === "growth") return "Plus";
    if (tier === "pro" || tier === "enterprise") return "Pro";
    return "Free";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
      <div className="max-w-md text-center">
        {processing ? (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Confirming payment...</h1>
            <p className="mt-3 text-sm text-slate-500">
              Please wait while we activate your subscription.
            </p>
          </>
        ) : error ? (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <span className="material-symbols-outlined text-3xl text-red-600">error</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-500">{error}</p>
            <button
              onClick={() => navigate({ to: "/billing" })}
              className="primary-action mt-6 px-6 text-sm"
            >
              Go to Billing
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="material-symbols-outlined text-3xl text-green-600">
                check_circle
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome to {billing ? tierLabel(billing.tier) : "your new plan"}!
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Your subscription is now active. Redirecting to billing in 3 seconds...
            </p>
            <button
              onClick={() => navigate({ to: "/billing" })}
              className="primary-action mt-6 px-6 text-sm"
            >
              Go to Billing
            </button>
          </>
        )}
      </div>
    </div>
  );
}
