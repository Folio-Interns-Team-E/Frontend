import { createFileRoute, Link } from "@tanstack/react-router";
import { formatPkr, PLANS } from "../lib/plans";

export const Route = createFileRoute("/_marketing/pricing")({
  head: () => ({ meta: [{ title: "Pricing · SaleSync" }] }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <main className="page-shell pb-20 pt-28">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Pricing</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Plans built for Pakistani sales teams
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Start free, then upgrade as your team and outbound volume grow. Paid plans provide 30
          days of workspace access per payment, with no automatic renewal.
        </p>
      </header>

      <section
        className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3"
        aria-label="Subscription plans"
      >
        {PLANS.map((plan) => (
          <article
            key={plan.tier}
            className={`section-panel relative flex flex-col p-6 ${
              plan.popular ? "border-primary ring-1 ring-primary" : ""
            }`}
          >
            {plan.popular && (
              <span className="absolute right-4 top-4 rounded bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-semibold text-slate-950">{plan.name}</h2>
            <p className="mt-2 min-h-10 text-sm text-slate-600">{plan.description}</p>
            <div className="mt-5 border-b border-slate-200 pb-5">
              <span className="text-3xl font-bold tabular-nums text-slate-950">
                {formatPkr(plan.price)}
              </span>
              {plan.price > 0 && <span className="ml-1 text-sm text-slate-500">/ 30 days</span>}
            </div>
            <ul className="mt-5 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-slate-700">
                  <span className="material-symbols-outlined mt-0.5 text-[16px] text-primary">
                    check
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className={`mt-6 w-full justify-center ${plan.popular ? "primary-action" : "secondary-action"}`}
            >
              {plan.tier === "free" ? "Start free" : `Buy ${plan.name} for 30 days`}
            </Link>
          </article>
        ))}
      </section>

      <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-500">
        Hunter and Apollo require your own provider credentials and may charge separately. Gmail
        sending limits also apply. Paid plans require manual renewal. Prices exclude applicable
        taxes.
      </p>
    </main>
  );
}
