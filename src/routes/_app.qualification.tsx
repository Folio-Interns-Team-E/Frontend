import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { discardLeadRemote, qualifyLeadRemote } from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { SkeletonCardGrid } from "../components/ui/skeleton";
import { fetchLeads } from "../store/apiThunks";

export const Route = createFileRoute("/_app/qualification")({
  head: () => ({
    meta: [
      { title: "Qualification · SalesSync AI" },
      {
        name: "description",
        content: "Review qualified leads scored on ICP match and intent signals.",
      },
    ],
  }),
  component: Qualification,
});

type FilterMode = "all" | "high" | "qualified" | "review";
type SortMode = "score-desc" | "score-asc";

function Qualification() {
  const dispatch = useAppDispatch();
  const leads = useAppSelector((state) => state.app.leads);
  const leadsStatus = useAppSelector((state) => state.app.leadsStatus);

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sortMode, setSortMode] = useState<SortMode>("score-desc");
  const cards = useMemo(() => {
    const visible = leads.filter((lead) => {
      if (lead.status === "Discarded") return false;
      if (filterMode === "high") return lead.score >= 85;
      if (filterMode === "qualified")
        return lead.status === "Qualified" || lead.status === "Drafted";
      if (filterMode === "review") return lead.score < 85;
      return true;
    });
    return [...visible].sort((a, b) =>
      sortMode === "score-desc" ? b.score - a.score : a.score - b.score,
    );
  }, [filterMode, leads, sortMode]);

  return (
    <>
      <TopBar title="Qualification" />
      <div className="page-shell">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Qualified Batch #422
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              Leads scored based on ICP match and intent signals.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["high", "High score"],
              ["qualified", "Qualified"],
              ["review", "Needs review"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilterMode(value as FilterMode)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-body-sm transition-colors ${
                  filterMode === value
                    ? "border-primary/30 bg-primary/10 font-bold text-primary"
                    : "border-outline-variant bg-white hover:bg-surface-container"
                }`}
              >
                {value === "all" && (
                  <span className="material-symbols-outlined text-[17px]">filter_list</span>
                )}
                {label}
              </button>
            ))}
            <button
              onClick={() =>
                setSortMode((mode) => (mode === "score-desc" ? "score-asc" : "score-desc"))
              }
              className="flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-body-sm transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[18px]">sort</span>
              {sortMode === "score-desc" ? "Score high-low" : "Score low-high"}
            </button>
          </div>
        </div>

        {leadsStatus === "loading" ? (
          <SkeletonCardGrid count={3} />
        ) : (
          <div className="mb-24 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {cards.length === 0 && (
              <div className="app-card col-span-full p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">
                  filter_alt_off
                </span>
                <p className="mt-3 text-sm font-bold">No leads match this filter.</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Try another filter or generate fresh ICP-matched leads.
                </p>
              </div>
            )}
            {cards.map((c) => (
              <div
                key={c.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden font-bold text-primary">
                      {c.initials}
                    </div>
                    <div>
                      <h4 className="font-body-base font-bold text-on-surface">{c.name}</h4>
                      <p className="text-[12px] text-on-surface-variant">
                        {c.title} @ {c.company}
                      </p>
                    </div>
                  </div>
                  <button className="text-on-surface-variant opacity-40 hover:opacity-100">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-label-caps text-on-surface-variant uppercase">
                      Fit Score
                    </span>
                    <span className="text-[11px] font-bold text-primary">{c.score}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${c.score}%` }} />
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  {[c.source, c.score >= 85 ? "High intent" : "Review"].map((t, i) => (
                    <span
                      key={t}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        i === 0
                          ? "bg-surface-container text-on-surface-variant"
                          : "bg-secondary-container/50 text-on-secondary-container"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg mb-5">
                  <p className="text-[12px] text-on-primary-fixed-variant italic">
                    “{c.reasoning}”
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void dispatch(qualifyLeadRemote(c.id))}
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-label-caps text-[12px] hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    {c.status === "Qualified" || c.status === "Drafted" ? "Qualified" : "Qualify"}
                  </button>
                  <button
                    onClick={() => dispatch(discardLeadRemote(c.id))}
                    className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg font-label-caps text-[12px] hover:bg-error/5 hover:text-error hover:border-error transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
