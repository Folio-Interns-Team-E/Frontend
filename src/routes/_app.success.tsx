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
  const token = auth.accessToken ?? localStorage.getItem("access_token");
  const teamId = useAppSelector((state) => state.app.team.id);

  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId || !token || !teamId) {
      setProcessing(false);
      setError("Missing session information. Redirecting to billing...");
      setTimeout(() => navigate({ to: "/billing" }), 2000);
      return;
    }

    api
      .completeCheckout(sessionId, token, teamId)
      .then((res) => {
        setBilling(res.data);
        setProcessing(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to confirm payment");
        setProcessing(false);
      });
  }, [token, teamId, navigate]);

  const tierLabel = (tier: string) => {
    if (tier === "growth") return "Growth";
    if (tier === "enterprise") return "Enterprise";
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
              className="mt-6 rounded-lg bg-[#0d2d39] px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary"
            >
              Go to Billing
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="material-symbols-outlined text-3xl text-green-600">check_circle</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome to {billing ? tierLabel(billing.tier) : "your new plan"}!</h1>
            <p className="mt-3 text-sm text-slate-500">
              Your subscription is now active. Redirecting to billing in 3 seconds...
            </p>
            <button
              onClick={() => navigate({ to: "/billing" })}
              className="mt-6 rounded-lg bg-[#0d2d39] px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary"
            >
              Go to Billing
            </button>
          </>
        )}
      </div>
    </div>
  );
}
