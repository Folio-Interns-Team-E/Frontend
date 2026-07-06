import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "../components/TopBar";
import { useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/knowledge-base")({
  head: () => ({
    meta: [
      { title: "Knowledge Base · SalesSync AI" },
      {
        name: "description",
        content: "Source library used to ground sales agents and proposal generation.",
      },
    ],
  }),
  component: KnowledgeBase,
});

function KnowledgeBase() {
  const assets = useAppSelector((state) => state.app.knowledgeAssets);

  return (
    <>
      <TopBar title="Knowledge Base" />
      <div className="page-shell space-y-5">
        <section className="flex flex-col justify-between gap-5 rounded-xl border border-primary/20 bg-primary/5 p-6 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">hub</span>
              <span className="text-[11px] font-bold uppercase tracking-widest">RAG ready</span>
            </div>
            <h2 className="text-xl font-bold">Every deal makes the next one smarter.</h2>
            <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
              Transcripts, proposals, and case studies are indexed here. Before drafting a proposal,
              SalesSync AI retrieves the three most relevant sources and shows exactly what grounded
              the output.
            </p>
          </div>
          <button className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-white">
            <span className="material-symbols-outlined text-[19px]">upload_file</span>
            Add source
          </button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Indexed sources", assets.length.toString(), "database"],
            ["Proposal retrieval", "Top 3", "manage_search"],
            ["Grounding coverage", "100%", "verified"],
          ].map(([label, value, icon]) => (
            <div key={label} className="rounded-xl border border-outline-variant bg-white p-5">
              <span className="material-symbols-outlined text-primary">{icon}</span>
              <p className="mt-3 text-2xl font-black">{value}</p>
              <p className="text-sm text-on-surface-variant">{label}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-white">
          <div className="flex items-center justify-between border-b border-outline-variant p-5">
            <div>
              <h2 className="font-bold">Source library</h2>
              <p className="text-sm text-on-surface-variant">
                Content available to the discovery and proposal agents.
              </p>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
                search
              </span>
              <input
                className="rounded-lg border border-outline-variant py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                placeholder="Search sources"
              />
            </div>
          </div>
          <div className="divide-y divide-outline-variant">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <span className="material-symbols-outlined">
                    {asset.type === "Transcript"
                      ? "record_voice_over"
                      : asset.type === "Proposal"
                        ? "description"
                        : "menu_book"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{asset.title}</p>
                  <p className="text-xs text-on-surface-variant">
                    {asset.type} · {asset.company} · {asset.date}
                  </p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  {asset.status}
                </span>
                <button className="material-symbols-outlined text-outline">more_horiz</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
