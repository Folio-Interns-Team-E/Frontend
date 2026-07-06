import { createFileRoute, Link } from "@tanstack/react-router";
import FeatureFunnelSection from "@/components/FeatureFunnelSection";

export const Route = createFileRoute("/_marketing/")({
  component: LandingPage,
});

function LandingPage() {
  const features = [
    {
      id: "lead-gen",
      icon: "person_add",
      title: "Lead Generation",
      description:
        "Continuously scan and extract fresh hyper-targeted company vectors matching your ideal customer profile (ICP).",
    },
    {
      id: "qualification",
      icon: "verified",
      title: "AI Qualification",
      description:
        "Deep-scrapes target triggers, news events, and financial filings to score high-converting match percentages perfectly.",
    },
    {
      id: "outreach",
      icon: "campaign",
      title: "Multi-Channel Outreach",
      description:
        "Generates ultra-custom initial hooks and dynamic sequence follow-ups matching localized context vectors.",
    },
    {
      id: "meetings",
      icon: "calendar_today",
      title: "Autonomous Meetings",
      description:
        "Handles active calendar counter-proposals and drops confirmed syncs straight into Outlook or Google Calendar.",
    },
    {
      id: "proposals",
      icon: "description",
      title: "Dynamic Proposals",
      description:
        "Auto-compiles target line-items, custom-priced contract clauses, and instant digital sign-off states.",
    },
    {
      id: "kb",
      icon: "database",
      title: "Context Knowledge Base",
      description:
        "Centralized internal vector playground indexing sales manuals, whitepapers, and product features securely.",
    },
  ];

  return (
    <div className="min-h-screen relative isolate overflow-hidden selection:bg-primary/20">
      {/* Decorative Background Glows */}
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

      {/* Hero Body Section */}
      <main className="page-shell pt-36 sm:pt-48 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="mb-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                Autonomous Revenue Operations
              </span>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-[#131b2e] sm:text-6xl lg:text-7xl !leading-[1.15]">
            Automate your sales pipeline from{" "}
            <span className="text-primary bg-gradient-to-r from-primary to-[#16a3a9] bg-clip-text text-transparent">
              end to end
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#505f76] max-w-2xl mx-auto">
            Discover hyper-targeted
            leads, qualifying prospects natively, sending custom omni-channel triggers, and closing
            contracts without touching structural friction.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link to="/register" className="primary-action !px-8 !py-4.5 !text-sm shadow-xl">
              <span className="material-symbols-outlined !text-base">auto_awesome</span>
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="text-sm font-bold leading-6 text-[#131b2e] hover:text-primary transition flex items-center gap-1"
            >
              Live Demo <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Dynamic App Dashboard Mockup Preview */}
        <div className="mt-20 sm:mt-24 lg:mt-32 soft-panel p-3 sm:p-4 bg-white/40 backdrop-blur-md">
          <div className="rounded-xl border border-outline-variant/40 overflow-hidden bg-white shadow-2xl flex flex-col md:flex-row h-[480px]">
            {/* Interactive Sidebar Mock */}
            <div className="w-full md:w-[210px] bg-[#f2f3ff] border-r border-outline-variant/30 p-4 flex flex-col gap-1 shrink-0">
              <div className="flex items-center gap-2 px-2 pb-4 mb-2 border-b border-outline-variant/20">
                <span className="material-symbols-outlined text-primary font-bold">menu_open</span>
                <span className="font-bold text-xs uppercase tracking-wider text-[#131b2e]">
                  Revenue Workspace
                </span>
              </div>
              {features.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${i === 0 ? "bg-primary text-white" : "text-[#505f76] hover:bg-[#eaedff]"}`}
                >
                  <span className="material-symbols-outlined !text-lg">{item.icon}</span>
                  {item.title}
                </div>
              ))}
            </div>

            {/* Simulated Live Workspace Canvas */}
            <div className="flex-1 bg-[#f4f7fb] p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
                <div>
                  <h3 className="text-[#131b2e] font-bold text-base flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">person_add</span> Lead
                    Engine Console
                  </h3>
                  <p className="text-xs text-[#505f76]">
                    Active background orchestration scanning global targets
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 bg-[#d3e4fe] text-[#0b1c30] rounded-full font-bold uppercase tracking-wider">
                  Agent Idle
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="text-[11px] font-bold text-[#505f76] uppercase">
                    Leads Discovered
                  </div>
                  <div className="text-2xl font-black text-[#131b2e] mt-1">14,281</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="text-[11px] font-bold text-[#505f76] uppercase">
                    Qualified Matches
                  </div>
                  <div className="text-2xl font-black text-primary mt-1">89.4%</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-sm">
                  <div className="text-[11px] font-bold text-[#505f76] uppercase">
                    Meetings Booked
                  </div>
                  <div className="text-2xl font-black text-[#a86516] mt-1">142</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-outline-variant/30 shadow-sm flex-1 flex flex-col gap-2">
                <div className="text-xs font-bold text-[#131b2e]">Pipeline Real-time Activity</div>
                <div className="border border-outline-variant/20 rounded-lg p-2.5 text-xs text-[#505f76] flex items-center justify-between bg-[#faf8ff]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Qualified
                    Acme Corp (94% Core Fit)
                  </span>
                  <span className="text-[10px] text-outline">Just now</span>
                </div>
                <div className="border border-outline-variant/20 rounded-lg p-2.5 text-xs text-[#505f76] flex items-center justify-between bg-[#faf8ff]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Drafted personalized hook
                    via LinkedIn updates for Initech CEO
                  </span>
                  <span className="text-[10px] text-outline">4m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid Section */}
        <FeatureFunnelSection features={features} />

        {/* Bottom CTA Section */}
        <div className="mt-24 sm:mt-32 mb-16">
          <div className="relative isolate overflow-hidden bg-[#0d2d39] px-6 py-16 shadow-2xl rounded-2xl sm:px-16 md:py-24 text-center border border-primary/20">
            <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Ready to hand off your cold sales cycle?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-slate-300">
              Deploy fully autonomous pipeline scaling agents inside your specific market vertical
              today. Risk-free trial.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-xl bg-primary px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-primary/90 transition"
              >
                Launch Workspace
              </Link>
              <Link
                to="/login"
                className="text-xs font-bold leading-6 text-white hover:text-primary transition"
              >
                Speak with Sales &rarr;
              </Link>
            </div>
            {/* Background Accent Mesh */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </main>
    </div>
  );
}
