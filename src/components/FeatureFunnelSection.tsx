import { useState, useEffect, MouseEvent } from "react";

interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

function FeatureFunnelSection({ features }: { features: FeatureItem[] }) {
  const [activeStage, setActiveStage] = useState<string>(features[0]?.id || "");
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // 1. Automatic Carousel Interval Flow (Advances every 3000ms)
  useEffect(() => {
    if (!features.length) return;

    const interval = setInterval(() => {
      setActiveStage((current) => {
        const currentIndex = features.findIndex((f) => f.id === current);
        const nextIndex = (currentIndex + 1) % features.length;
        return features[nextIndex].id;
      });
    }, 500); // 3 seconds per lifecycle stage

    return () => clearInterval(interval);
  }, [features]);

  // Subtle mouse tracker for the glass background vector graphic
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = ((clientX - left) / width - 0.5) * 15;
    const y = ((clientY - top) / height - 0.5) * 15;
    setParallaxOffset({ x, y });
  };

  const activeFeature = features.find((f) => f.id === activeStage) || features[0];

  return (
    <div className="mt-24 sm:mt-32 relative" onMouseMove={handleMouseMove}>
      {/* Parallax Background Floating Vector Element */}
      <div
        className="absolute right-10 top-12 w-72 h-72 rounded-full bg-gradient-to-br from-primary/10 to-[#16a3a9]/5 blur-2xl pointer-events-none transition-transform duration-300 ease-out hidden lg:block"
        style={{
          transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
        }}
      />

      <div className="text-center max-w-3xl mx-auto mb-16 px-4">
        <h2 className="section-heading">Full Funnel Control</h2>
        <p className="mt-3 text-3xl font-black tracking-tight text-[#131b2e] sm:text-4xl">
          One operational hub from discovery to close
        </p>
        <p className="mt-2 text-xs text-[#505f76]">
          Watch our system walk through a mock automated cycle execution sequentially.
        </p>
      </div>

      {/* Interactive Flow Architecture Container */}
      <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Process Sequence (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-4 relative">
          {/* Vertical Connecting Line Graphic */}
          <div className="absolute left-[33px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/40 via-outline-variant/30 to-transparent pointer-events-none hidden sm:block" />

          {features.map((item, index) => {
            const isActive = activeStage === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveStage(item.id)} // Users can still manually select if they want
                className={`app-card p-5 flex gap-4 cursor-pointer relative transition-all duration-300 overflow-hidden ${
                  isActive
                    ? "border-primary bg-white ring-1 ring-primary/25 shadow-md"
                    : "opacity-60 hover:opacity-90"
                }`}
              >
                {/* Active Micro-loader Track Background (Fills over 3s when active) */}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-primary to-[#16a3a9] animate-[linkProgress_3s_linear_infinite]"
                    style={{ width: "100%" }}
                  />
                )}

                {/* Step Indicator Pill */}
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 shrink-0 z-10 ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-[rgb(8_127_140_/_9%)] text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined font-semibold text-lg">
                    {item.icon}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">
                      0{index + 1}.
                    </span>
                    <h3 className="text-sm font-bold text-[#131b2e]">{item.title}</h3>
                  </div>
                  {/* Stable Text Layout Block — Always visible, no height layout updates */}
                  <div className="mt-1.5">
                    <p className="text-xs leading-relaxed text-[#505f76]">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Reactive Real-time Sandbox Display (5 Columns) */}
        <div className="lg:col-span-5 sticky top-28 soft-panel p-4 bg-white/80 backdrop-blur-md border-primary/20 shadow-xl min-h-[360px] flex flex-col justify-between overflow-hidden">
          {/* Scanner Line Glow Animation */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-[pulse_2s_infinite]" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#131b2e]">
                  Live Agent Telemetry
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 font-mono rounded bg-primary/10 text-primary uppercase font-bold animate-pulse">
                Auto Syncing
              </span>
            </div>

            {/* Dynamic context rendered smoothly based on automated state */}
            <div className="space-y-3 transition-all duration-300">
              <div className="p-3 bg-[#f4f7fb] rounded-xl border border-outline-variant/30">
                <div className="text-[10px] text-primary font-bold uppercase tracking-wider">
                  Targeting Module
                </div>
                <div className="text-sm font-black text-[#131b2e] mt-0.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">{activeFeature?.icon}</span>
                  {activeFeature?.title} Engine
                </div>
              </div>

              <div className="p-3 bg-[#faf8ff] rounded-xl border border-outline-variant/20 space-y-2">
                <div className="text-[10px] text-[#505f76] font-bold uppercase">
                  Simulated Pipeline Command
                </div>
                <div className="font-mono text-[11px] text-[#3e484d] bg-white p-2 rounded border border-outline-variant/10 leading-normal break-all">
                  {`>>> initialising_agent_stack [${activeFeature?.id || "null"}]`}
                  <br />
                  {`>>> parsing operational parameters...`}
                  <br />
                  <span className="text-primary font-bold">{`>>> processing matrix vectors successfully.`}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-outline-variant/30 pt-3 mt-6 flex items-center justify-between text-xs text-[#505f76]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-[#a86516]">
                settings_ethernet
              </span>
              No human friction
            </span>
            <span className="font-mono text-[10px] text-outline">v2.0.0_stable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureFunnelSection;
