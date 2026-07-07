import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import {
  discardLead,
  draftEmail,
  generateLeadsFromIcp,
  qualifyLead,
  sendEmail,
} from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { SkeletonTable } from "../components/ui/skeleton";
import { fetchLeads } from "../store/apiThunks";

export const Route = createFileRoute("/_app/lead-generation")({
  head: () => ({
    meta: [
      { title: "Lead Generation · SalesSync AI" },
      {
        name: "description",
        content:
          "Run scrapers and surface high-fit prospects across LinkedIn, Crunchbase and Apollo.",
      },
    ],
  }),
  component: LeadGeneration,
});

function LeadGeneration() {
  const dispatch = useAppDispatch();
  const leads = useAppSelector((state) => state.app.leads);
  const leadsStatus = useAppSelector((state) => state.app.leadsStatus);
  const onboarding = useAppSelector((state) => state.app.onboarding);
  const apolloConnected = useAppSelector((state) => state.app.integrations.apollo);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (leadsStatus === "idle") dispatch(fetchLeads());
  }, [leadsStatus, dispatch]);
  const [fitFilter, setFitFilter] = useState("all");

  const filteredLeads = leads.filter((lead) => {
    const query = search.toLowerCase();
    const matchesSearch = [lead.name, lead.company, lead.title, lead.email, lead.reasoning].some(
      (value) => value.toLowerCase().includes(query),
    );
    const matchesFit =
      fitFilter === "all" ||
      (fitFilter === "high" && lead.score >= 85) ||
      (fitFilter === "medium" && lead.score >= 65 && lead.score < 85) ||
      (fitFilter === "low" && lead.score < 65);
    return matchesSearch && matchesFit;
  });

  return (
    <>
      <TopBar title="Lead Generation" />
      <section className="page-shell">
        <div className="app-card flex flex-wrap items-center gap-3 p-4">
          <div className="flex-1 min-w-[200px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-white py-2.5 pl-10 pr-4 text-body-base shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="Search name, company, title, email, ICP reasoning..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={fitFilter}
              onChange={(event) => setFitFilter(event.target.value)}
              className="rounded-xl border border-outline-variant bg-white px-3 py-2.5 text-body-sm text-on-surface shadow-sm focus:outline-none"
            >
              <option value="all">Fit: All</option>
              <option value="high">High fit 85+</option>
              <option value="medium">Medium fit 65-84</option>
              <option value="low">Low fit below 65</option>
            </select>
          </div>
          <button onClick={() => dispatch(generateLeadsFromIcp())} className="primary-action">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            Generate from ICP
          </button>
        </div>
        {onboarding.icp.length > 0 && (
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary">
            Current ICP: {onboarding.icp.join(" • ")}
          </div>
        )}
        {!apolloConnected && (
          <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            Connect Apollo in Settings before pulling production leads.
          </div>
        )}

        {leadsStatus === "loading" ? (
          <SkeletonTable rows={5} cols={6} />
        ) : (
          <div className="app-card mt-6 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/45">
                  {["Name", "Company", "Source", "Fit Score", "Status", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider ${
                        h === "Fit Score" ? "text-center" : ""
                      } ${h === "Actions" ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {filteredLeads.map((r, index) => (
                  <Fragment key={r.id}>
                    <tr
                      className={
                        index === 0
                          ? "bg-primary/5"
                          : "hover:bg-surface-container-low/50 transition-colors cursor-pointer group"
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${
                              index === 0
                                ? "bg-primary-container/20 text-primary"
                                : "bg-outline-variant/20 text-on-surface-variant"
                            }`}
                          >
                            {r.initials}
                          </div>
                          <span
                            className={`font-body-base ${
                              index === 0 ? "text-on-surface font-semibold" : "text-on-surface"
                            }`}
                          >
                            {r.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-body-base text-on-surface-variant">{r.company}</p>
                        <p className="text-[11px] text-outline">{r.title}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[11px] font-medium border border-outline-variant/20">
                          {r.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-mono-label font-bold text-lg ${
                            index === 0 ? "text-primary" : "text-on-surface-variant/80"
                          }`}
                        >
                          {r.score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`flex items-center gap-1.5 ${
                            r.status === "Discarded"
                              ? "text-error"
                              : r.status === "Qualified" || r.status === "Drafted"
                                ? "text-green-700"
                                : "text-primary"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.status === "Discarded"
                                ? "bg-error"
                                : r.status === "Qualified" || r.status === "Drafted"
                                  ? "bg-green-600"
                                  : "bg-primary"
                            }`}
                          />
                          <span className="text-body-sm font-medium">{r.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => dispatch(qualifyLead(r.id))}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Qualify
                          </button>
                          <button
                            onClick={() =>
                              dispatch(r.status === "Drafted" ? sendEmail(r.id) : draftEmail(r.id))
                            }
                            className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary hover:bg-primary/10"
                          >
                            {r.status === "Drafted" ? "Send" : "Draft"}
                          </button>
                          <button
                            onClick={() => dispatch(discardLead(r.id))}
                            className="rounded-lg border border-error/20 bg-error/5 px-2.5 py-1 text-[10px] font-bold text-error hover:bg-error/10"
                          >
                            Discard
                          </button>
                        </div>
                      </td>
                    </tr>
                    {index === 0 && r.email && (
                      <tr className="bg-primary/[0.02]">
                        <td className="px-6 py-4" colSpan={6}>
                          <div className="flex items-center gap-stack_gap_md border border-primary/20 rounded-xl p-4 bg-white/50 backdrop-blur-sm">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                                  mail
                                </span>
                                <span className="text-body-sm text-on-surface-variant">
                                  {r.email}
                                </span>
                              </div>
                            </div>
                            <div className="flex-[2] bg-primary/[0.05] border border-primary/10 rounded-lg px-4 py-2.5 flex items-start gap-3">
                              <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                                auto_awesome
                              </span>
                              <p className="text-body-sm text-on-primary-fixed-variant leading-tight">
                                {r.reasoning}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low/20 flex justify-between items-center">
              <span className="text-body-sm text-on-surface-variant">
                Showing {filteredLeads.length} of {leads.length} ICP-matched leads
              </span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-body-sm border border-outline-variant rounded hover:bg-surface transition-colors">
                  Previous
                </button>
                <button className="px-3 py-1 text-body-sm border border-outline-variant rounded hover:bg-surface transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
