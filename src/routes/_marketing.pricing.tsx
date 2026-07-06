import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_marketing/pricing")({
  component: PricingPage,
});

function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: "Starter Agent",
      id: "tier-starter",
      priceMonthly: "TBD",
      priceAnnual: "TBD",
      description:
        "Perfect for founders and solo operators automating their first outbound channel.",
      features: [
        "1 Autonomous AI Agent node",
        "1,000 Verified lead exports / mo",
        "Deep LinkedIn & Web scraping profile triggers",
        "Basic Omni-channel outreach (Email only)",
        "Standard Google Calendar sync",
        "Community & Knowledge Base access",
      ],
      cta: "Start Free Trial",
      mostPopular: false,
    },
    {
      name: "Growth Workspace",
      id: "tier-growth",
      priceMonthly: "TBD",
      priceAnnual: "TBD",
      description:
        "Engineered for scaling B2B teams requiring multi-channel operations and auto-closing pipelines.",
      features: [
        "3 Autonomous AI Agent nodes",
        "5,000 Verified lead exports / mo",
        "Advanced financial & trigger event tracking",
        "Full Multi-channel outreach (Email & LinkedIn)",
        "Autonomous meeting management & counter-proposals",
        "Dynamic proposal builder with automatic pricing models",
        "Priority live agent telemetry matrix dashboard",
      ],
      cta: "Scale Outbound Now",
      mostPopular: true,
    },
    {
      name: "Enterprise Engine",
      id: "tier-enterprise",
      priceMonthly: "TBD",
      priceAnnual: "TBD",
      description:
        "Custom capabilities for mature revenue groups seeking unrestricted scale and custom model training.",
      features: [
        "Unlimited AI Agent nodes",
        "Custom data scrape allocations",
        "Dedicated model tuning based on your custom playbooks",
        "Full CRM integrations (Salesforce, HubSpot, etc.)",
        "Custom pricing legal contracts & automated redlines",
        "Dedicated Account Solutions Engineer",
        "99.9% Telemetry Uptime SLA guarantees",
      ],
      cta: "Contact Architecture Team",
      mostPopular: false,
    },
  ];

  return (
    <div className="min-h-screen relative isolate overflow-hidden selection:bg-primary/20">
      {/* Structural Background Glows */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-13rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#16a3a9] opacity-15 sm:left-[calc(50%-36rem)] sm:w-[72.187rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      {/* Navigation Header */}

      {/* Main Container Header */}
      <main className="page-shell pt-36 sm:pt-42 lg:pt-24 pb-24">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <h2 className="section-heading">Predictable Investment</h2>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#131b2e] sm:text-5xl lg:text-6xl !leading-[1.15]">
            Transparent pricing for{" "}
            <span className="text-primary bg-gradient-to-r from-primary to-[#16a3a9] bg-clip-text text-transparent">
              unbounded growth
            </span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#505f76] max-w-xl mx-auto">
            Choose an automated workspace plan calculated to align with your monthly outbound
            pipeline metrics perfectly.
          </p>

          {/* Toggle Button Container */}
          <div className="mt-10 flex justify-center items-center gap-3">
            <span
              className={`text-xs font-semibold ${!isAnnual ? "text-[#131b2e]" : "text-[#505f76]"}`}
            >
              Monthly Billing
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-[#eaedff] transition-colors duration-200 ease-in-out focus:outline-none ring-1 ring-outline-variant/30"
              style={{ backgroundColor: isAnnual ? "var(--color-primary)" : "" }}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isAnnual ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-xs font-semibold flex items-center gap-1.5 ${isAnnual ? "text-[#131b2e]" : "text-[#505f76]"}`}
            >
              Annual Saving
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                Save ~25%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Matrix Grid Structure */}
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch mt-16 px-4">
          {tiers.map((tier) => {
            const currentPrice = isAnnual ? tier.priceAnnual : tier.priceMonthly;
            return (
              <div
                key={tier.id}
                className={`app-card p-8 flex flex-col justify-between relative transition-all duration-300 ${
                  tier.mostPopular
                    ? "border-primary ring-2 ring-primary/20 bg-white scale-105 z-10 shadow-xl md:translate-y-[-10px]"
                    : "bg-white/90 hover:border-outline-variant"
                }`}
              >
                {/* Most Popular Badge Banner */}
                {tier.mostPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-primary px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md">
                    Most Popular Hub
                  </span>
                )}

                <div>
                  <h3 className="text-base font-black tracking-tight text-[#131b2e]">
                    {tier.name}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-[#505f76] min-h-[40px]">
                    {tier.description}
                  </p>

                  {/* Financial Metrics */}
                  <div className="mt-6 flex items-baseline gap-x-1.5 border-b border-outline-variant/20 pb-6">
                    <span className="text-4xl font-black tracking-tight text-[#131b2e]">
                      {currentPrice}
                    </span>
                    <span className="text-xs font-bold leading-6 text-[#505f76]">/ month</span>
                    {isAnnual && (
                      <span className="text-[10px] text-primary font-bold ml-auto bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                        Billed annually
                      </span>
                    )}
                  </div>

                  {/* Core Features Check-list */}
                  <ul className="mt-6 space-y-3 text-xs leading-relaxed text-[#3e484d]">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-primary text-base font-bold shrink-0 mt-0.5">
                          check_circle
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Primary Core Actions */}
                <div className="mt-8">
                  <Link
                    to="/register"
                    className={`w-full text-center ${
                      tier.mostPopular
                        ? "primary-action !w-full !py-3.5 shadow-lg shadow-primary/20 text-sm font-bold"
                        : "inline-flex w-full items-center justify-center rounded-xl border border-outline px-4 py-3 text-xs font-bold text-[#131b2e] bg-white hover:bg-[#f4f7fb] hover:border-primary transition duration-150"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mini Trust Badging FAQ Subsection */}
        <div className="mt-24 max-w-4xl mx-auto border-t border-outline-variant/30 pt-16 px-4">
          <div className="text-center mb-12">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              Frequently Addressed Queries
            </h2>
            <p className="mt-2 text-xl font-black text-[#131b2e]">
              Operational Safeguards & Licensing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed text-[#505f76]">
            <div>
              <h4 className="font-bold text-[#131b2e] text-sm mb-2">
                Can I modify my active nodes anytime?
              </h4>
              <p>
                Absolutely. You can scale up agent counts or downgrade tiers mid-billing cycles
                directly from your workspace console settings. Vector balances recalculate
                instantaneously.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[#131b2e] text-sm mb-2">
                How secure are our workspace internal variables?
              </h4>
              <p>
                Your internal Knowledge Base, client list metrics, and target playbooks are strictly
                siloed inside dedicated database vector containers. No shared core fine-tuning
                happens.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
