import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { buildLeads } from "../store/appSlice";
import {
  createLeadRemote,
  discardLeadRemote,
  draftEmailRemote,
  qualifyLeadRemote,
} from "../store/apiThunks";
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
  const icp = useAppSelector((state) => state.app.onboarding.icp);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);
  const [fitFilter, setFitFilter] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLeads = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    const existingEmails = new Set(leads.map((lead) => lead.email.toLowerCase()));
    const newLeads = buildLeads(icp).filter(
      (lead) => !existingEmails.has(lead.email.toLowerCase()),
    );
    try {
      await Promise.all(
        newLeads.map((lead) =>
          dispatch(
            createLeadRemote({
              name: lead.name,
              company: lead.company,
              title: lead.title,
              email: lead.email,
              source: lead.source,
              status: lead.status,
              score: lead.score ?? undefined,
              reasoning: lead.reasoning,
            }),
          ).unwrap(),
        ),
      );
      dispatch(fetchLeads());
    } finally {
      setIsGenerating(false);
    }
  };

  const draftLead = (lead: (typeof leads)[number]) => {
    void dispatch(
      draftEmailRemote({
        leadId: lead.id,
        subject: `Intro - ${lead.company || "SalesSync"}`,
        body: `Hi ${lead.name},\n\nI would like to discuss how SalesSync can support ${lead.company || "your team"}.`,
      }),
    );
  };

  const filteredLeads = leads.filter((lead) => {
    const query = search.toLowerCase();
    const matchesSearch = [lead.name, lead.company, lead.title, lead.email, lead.reasoning].some(
      (value) => value.toLowerCase().includes(query),
    );
    const matchesFit =
      fitFilter === "all" ||
      (fitFilter === "high" && (lead.score ?? -1) >= 85) ||
      (fitFilter === "medium" && (lead.score ?? -1) >= 65 && (lead.score ?? -1) < 85) ||
      (fitFilter === "low" && lead.score != null && lead.score < 65);
    return matchesSearch && matchesFit;
  });

  return (
    <>
      <TopBar title="Lead Generation" />
      <section className="page-shell">
        <div className="section-panel flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
          <div className="flex-1 min-w-[200px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="control w-full py-2.5 pl-10 pr-4 text-body-base outline-none"
              placeholder="Search name, company, title, email, ICP reasoning..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-auto">
            <select
              value={fitFilter}
              onChange={(event) => setFitFilter(event.target.value)}
              className="control w-full px-3 py-2.5 text-body-sm text-on-surface outline-none sm:w-auto"
            >
              <option value="all">Fit: All</option>
              <option value="high">High fit 85+</option>
              <option value="medium">Medium fit 65-84</option>
              <option value="low">Low fit below 65</option>
            </select>
          </div>
          <button
            onClick={() => void generateLeads()}
            disabled={isGenerating}
            className="primary-action w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            {isGenerating ? "Generating..." : "Generate from ICP"}
          </button>
        </div>

        {leadsStatus === "loading" ? (
          <SkeletonTable rows={5} cols={6} />
        ) : (
          <div className="table-shell mt-5 sm:mt-6">
            <div className="custom-scrollbar overflow-x-auto">
              <table className="data-table min-w-[920px] w-full border-collapse text-left">
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
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <span className="material-symbols-outlined text-4xl text-outline">
                            person_search
                          </span>
                          <p className="text-sm font-bold text-on-surface">
                            No leads match these filters
                          </p>
                          <p className="text-xs">
                            Adjust the search or fit score to see more prospects.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
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
                            {r.score ?? "N/A"}
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
                              onClick={() => dispatch(qualifyLeadRemote(r.id))}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Qualify
                            </button>
                            <button
                              onClick={() => draftLead(r)}
                              className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary hover:bg-primary/10"
                            >
                              Draft
                            </button>
                            <button
                              onClick={() => dispatch(discardLeadRemote(r.id))}
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
            </div>
            <div className="flex flex-col gap-3 border-t border-outline-variant/45 bg-surface-container-low/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="text-body-sm text-on-surface-variant">
                Showing {filteredLeads.length} of {leads.length} ICP-matched leads
              </span>
              <div className="flex items-center gap-2">
                <button className="secondary-action min-h-8 px-3 py-1">Previous</button>
                <button className="secondary-action min-h-8 px-3 py-1">Next</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
