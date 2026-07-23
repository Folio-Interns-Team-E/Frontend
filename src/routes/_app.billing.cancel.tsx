import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/billing/cancel")({
  head: () => ({ meta: [{ title: "Checkout Cancelled · SalesSync AI" }] }),
  component: BillingCancel,
});

function BillingCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate({ to: "/billing" }), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <span className="material-symbols-outlined text-3xl text-amber-600">cancel</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Checkout Cancelled</h1>
        <p className="mt-3 text-sm text-slate-500">
          No charges were made. Redirecting to billing in 3 seconds...
        </p>
        <button
          onClick={() => navigate({ to: "/billing" })}
          className="mt-6 rounded-lg bg-[#0d2d39] px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary"
        >
          Go to Billing
        </button>
      </div>
    </div>
  );
}
