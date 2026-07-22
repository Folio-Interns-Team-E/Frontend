import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { setActiveTeam, createTeamLocal, joinTeamLocal } from "../store/appSlice";
import { createTeamRemote, joinTeamRemote, fetchMyTeams } from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/team-setup")({
  head: () => ({ meta: [{ title: "Choose your team · SalesSync AI" }] }),
  component: TeamSetup,
});

type Choice = "join" | "create" | null;

function getInviteCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("invite");
}

function TeamSetup() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.app.profile);
  const auth = useAppSelector((state) => state.app.auth);
  const team = useAppSelector((state) => state.app.team);
  const urlInviteCode = getInviteCodeFromUrl();
  const [choice, setChoice] = useState<Choice>(urlInviteCode ? "join" : null);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState(urlInviteCode || "");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const accessToken =
    auth.accessToken ??
    (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);

  useEffect(() => {
    const token = accessToken && accessToken !== "undefined" ? accessToken : null;
    if (token && auth.userTeamsStatus === "idle") {
      dispatch(fetchMyTeams(token));
    }
  }, [accessToken, auth.userTeamsStatus, dispatch]);

  useEffect(() => {
    if (auth.userTeamsStatus !== "succeeded") return;
    if (auth.userTeams.length > 0 && auth.teamChoiceCompleted) {
      navigate({ to: "/dashboard" });
    }
  }, [auth.userTeamsStatus, auth.userTeams.length, auth.teamChoiceCompleted, navigate]);

  function continueToDashboard() {
    void navigate({ to: "/dashboard" });
  }

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    const result = auth.accessToken
      ? await dispatch(createTeamRemote({ name: teamName, accessToken: auth.accessToken }))
      : null;
    if (createTeamRemote.fulfilled.match(result)) {
      setToast({ message: "Team created successfully!", type: "success" });
      setTimeout(() => continueToDashboard(), 1200);
    } else {
      dispatch(createTeamLocal({ name: teamName }));
      setToast({ message: "Team created successfully!", type: "success" });
      setTimeout(() => continueToDashboard(), 1200);
    }
  }

  async function submitJoin(event: FormEvent) {
    event.preventDefault();
    const result = auth.accessToken
      ? await dispatch(joinTeamRemote({ inviteCode, accessToken: auth.accessToken }))
      : null;
    if (joinTeamRemote.fulfilled.match(result)) {
      setToast({ message: "Joined team successfully!", type: "success" });
      setTimeout(() => continueToDashboard(), 1200);
    } else {
      dispatch(joinTeamLocal({ inviteCode }));
      setToast({ message: "Joined team successfully!", type: "success" });
      setTimeout(() => continueToDashboard(), 1200);
    }
  }

  if (auth.userTeamsStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  if (
    auth.userTeamsStatus === "succeeded" &&
    auth.userTeams.length > 0 &&
    !auth.teamChoiceCompleted
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-5">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d1f2d] to-primary text-white shadow-lg">
              <span className="material-symbols-outlined text-[24px]">groups</span>
            </div>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-on-surface">
              Choose a team
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              You are a member of multiple teams. Select which one to manage.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {auth.userTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  dispatch(setActiveTeam(team));
                  navigate({ to: "/dashboard" });
                }}
                className="app-card app-card-hover flex items-center gap-4 p-5 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[22px]">apartment</span>
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-on-surface">{team.name}</p>
                  <p className="mt-0.5 text-xs capitalize text-on-surface-variant">
                    Your role: {team.role}
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">
                  arrow_forward_ios
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f7fb] px-4 py-6 sm:px-5 sm:py-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="relative mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d1f2d] to-primary text-white shadow-lg">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <p className="font-extrabold">SalesSync AI</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Workspace setup
              </p>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold">{profile.name}</p>
            <p className="text-[10px] text-slate-400">{profile.email}</p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
            One quick choice
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-on-surface sm:text-4xl">
            How will you work in SalesSync AI?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">
            Join an existing sales team with an invite code, create a new workspace, or explore on
            your own for now.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <ChoiceCard
            icon="group_add"
            title="Join a team"
            description="Use the invitation code sent to you by a team admin."
            selected={choice === "join"}
            onClick={() => setChoice("join")}
          />
          <ChoiceCard
            icon="domain_add"
            title="Create a team"
            description="Start a new workspace. You'll automatically become its admin."
            selected={choice === "create"}
            recommended
            onClick={() => setChoice("create")}
          />
        </div>

        {(team.error || !auth.accessToken) && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-xs text-error">
            {team.error ?? "Please log in before creating or joining a team."}
          </div>
        )}

        {toast && (
          <div
            className={`mx-auto mt-6 flex max-w-2xl items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg transition-all ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-error/20 bg-error/5 text-error"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            {toast.message}
          </div>
        )}

        {choice === "join" && (
          <form onSubmit={submitJoin} className="app-card mx-auto mt-6 max-w-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-primary">
                <span className="material-symbols-outlined">key</span>
              </div>
              <div className="flex-1">
                <h2 className="font-extrabold">Enter your invite code</h2>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Codes can be shared by email, chat, or any external channel.
                </p>
                <div className="mt-4 flex gap-3">
                  <input
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    placeholder="Example: NORTH-7X9K"
                    required
                    className="control h-11 flex-1 px-4 font-mono text-sm uppercase outline-none"
                  />
                  <button
                    disabled={team.status === "loading" || !auth.accessToken}
                    className="rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-md shadow-primary/20 disabled:opacity-60"
                  >
                    {team.status === "loading" ? "Joining..." : "Join team"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {choice === "create" && (
          <form onSubmit={submitCreate} className="app-card mx-auto mt-6 max-w-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <span className="material-symbols-outlined">apartment</span>
              </div>
              <div className="flex-1">
                <h2 className="font-extrabold">Name your sales team</h2>
                <p className="mt-1 text-xs text-on-surface-variant">
                  You’ll become the first admin and receive an invite code to share.
                </p>
                <div className="mt-4 flex gap-3">
                  <input
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder="Example: Acme Revenue Team"
                    required
                    className="control h-11 flex-1 px-4 text-sm outline-none"
                  />
                  <button
                    disabled={team.status === "loading" || !auth.accessToken}
                    className="rounded-xl bg-[#102b38] px-5 text-sm font-bold text-white shadow-md disabled:opacity-60"
                  >
                    {team.status === "loading" ? "Creating..." : "Create team"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  selected,
  recommended = false,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  recommended?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`app-card app-card-hover relative min-h-56 p-6 text-left ${
        selected ? "border-primary ring-4 ring-primary/10" : ""
      }`}
    >
      {recommended && (
        <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-primary">
          Recommended
        </span>
      )}
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[#102b38]">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h2 className="mt-6 text-lg font-extrabold">{title}</h2>
      <p className="mt-2 text-xs leading-5 text-on-surface-variant">{description}</p>
      <span className="absolute bottom-5 right-5 material-symbols-outlined text-[19px] text-primary">
        arrow_forward
      </span>
    </button>
  );
}
