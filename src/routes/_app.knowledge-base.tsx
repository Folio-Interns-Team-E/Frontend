import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "../components/TopBar";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { SkeletonList } from "../components/ui/skeleton";
import { fetchKnowledgeAssets, uploadKnowledgeAsset } from "../store/apiThunks";

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
  const dispatch = useAppDispatch();
  const assets = useAppSelector((state) => state.app.knowledgeAssets);
  const assetsStatus = useAppSelector((state) => state.app.knowledgeAssetsStatus);

  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (assetsStatus === "idle") dispatch(fetchKnowledgeAssets());
  }, [assetsStatus, dispatch]);

  const filtered = assets.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    try {
      await dispatch(
        uploadKnowledgeAsset({
          file,
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      ).unwrap();
      setShowUpload(false);
      setTitle("");
      setDescription("");
      setFile(null);
    } catch {
      // error handled by thunk
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <TopBar title="Knowledge Base" />
      <div className="page-shell space-y-5">
        <section className="flex flex-col justify-between gap-5 rounded-xl border border-primary/18 bg-primary/[0.055] p-5 sm:p-6 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">hub</span>
              <span className="text-[11px] font-bold uppercase tracking-widest">RAG ready</span>
            </div>
            <h2 className="text-xl font-bold">Every deal makes the next one smarter.</h2>
            <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
              Upload PDF documents — transcripts, case studies, whitepapers — to ground proposal
              generation and agent discovery.
            </p>
          </div>
          <button onClick={() => setShowUpload(true)} className="primary-action shrink-0">
            <span className="material-symbols-outlined text-[19px]">upload_file</span>
            Add source
          </button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Indexed sources", assets.length.toString(), "database"],
            ["Proposal retrieval", "Top 3", "manage_search"],
            ["Grounding coverage", assets.length > 0 ? "100%" : "—", "verified"],
          ].map(([label, value, icon]) => (
            <div key={label} className="metric-card p-5">
              <span className="material-symbols-outlined text-primary">{icon}</span>
              <p className="mt-3 text-2xl font-black">{value}</p>
              <p className="text-sm text-on-surface-variant">{label}</p>
            </div>
          ))}
        </section>

        <section className="section-panel">
          <div className="section-header">
            <div>
              <h2 className="font-bold">Source library</h2>
              <p className="text-sm text-on-surface-variant">
                Content available to the discovery and proposal agents.
              </p>
            </div>
            <div className="relative w-full sm:w-auto">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="control w-full py-2 pl-9 pr-3 text-sm outline-none sm:w-auto"
                placeholder="Search sources"
              />
            </div>
          </div>
          {assetsStatus === "loading" ? (
            <SkeletonList count={4} />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined text-[40px]">folder_off</span>
              <p className="text-sm font-semibold">No sources yet</p>
              <p className="text-xs">Upload a PDF document to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {filtered.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 p-4 transition hover:bg-primary/[0.025] sm:gap-4 sm:p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary">
                    <span className="material-symbols-outlined">
                      {asset.fileType === "pdf" ? "picture_as_pdf" : "description"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{asset.title}</p>
                    <p className="text-xs text-on-surface-variant">
                      {asset.fileType?.toUpperCase()}
                      {asset.fileSize ? ` · ${(asset.fileSize / 1024).toFixed(0)} KB` : ""}
                      {asset.tags.length > 0 ? ` · ${asset.tags.join(", ")}` : ""}
                    </p>
                  </div>
                  {asset.presignedUrl && (
                    <a
                      href={asset.presignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span className="hidden sm:inline">View</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showUpload && (
        <div className="modal-backdrop" onClick={() => !uploading && setShowUpload(false)}>
          <div className="modal-surface max-w-md p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-5 text-lg font-bold">Upload document</h3>

            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              File (PDF only)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="control mb-4 w-full p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
            />

            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="control mb-4 w-full px-3 py-2 text-sm outline-none"
              placeholder="e.g. Q3 Market Analysis"
            />

            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="control mb-5 w-full px-3 py-2 text-sm outline-none"
              placeholder="Brief description of the document"
            />

            <div className="flex justify-end gap-3">
              <button
                disabled={uploading}
                onClick={() => setShowUpload(false)}
                className="secondary-action"
              >
                Cancel
              </button>
              <button
                disabled={uploading || !file || !title.trim()}
                onClick={handleUpload}
                className="primary-action disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading…
                  </>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
