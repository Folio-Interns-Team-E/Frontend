import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { TopBar } from "../components/TopBar";
import {
  inviteMemberLocal,
  removeMemberLocal,
  type TeamRole,
  updateMemberRoleLocal,
} from "../store/appSlice";
import {
  fetchTeamRemote,
  inviteMemberRemote,
  removeMemberRemote,
  updateMemberRoleRemote,
} from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/team")({
  head: () => ({ meta: [{ title: "Team management · SalesSync AI" }] }),
  component: TeamManagement,
});

function TeamManagement() {
  const dispatch = useAppDispatch();
  const team = useAppSelector((state) => state.app.team);
  const auth = useAppSelector((state) => state.app.auth);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const isAdmin = team.currentUserRole === "admin";
  const canManageMembers = team.currentUserRole === "admin" || team.currentUserRole === "manager";

  async function invite(event: FormEvent) {
    event.preventDefault();
    const result = auth.accessToken
      ? await dispatch(inviteMemberRemote({ email, accessToken: auth.accessToken }))
      : null;
    if (inviteMemberRemote.fulfilled.match(result)) {
      setEmail("");
      if (team.id) {
        await dispatch(fetchTeamRemote({ teamId: team.id, accessToken: auth.accessToken ?? "" }));
      }
      return;
    }
    dispatch(inviteMemberLocal({ email }));
    setEmail("");
  }

  function copyInviteCode() {
    if (!team.inviteCode) return;
    void navigator.clipboard?.writeText(team.inviteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (!team.id) {
    return (
      <>
        <TopBar title="Team management" />
        <div className="flex min-h-[calc(100vh-72px)] items-center justify-center p-7">
          <div className="app-card max-w-lg p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-primary">group_off</span>
            <h1 className="mt-4 text-xl font-black">Team details are not available yet</h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              The current backend join response confirms success but does not return the team ID.
              Create a team to manage it immediately, or enter a known team ID once that lookup is
              available from the backend.
            </p>
            <a
              href="/team-setup"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white"
            >
              Set up a team
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Team management" />
      <div className="page-shell space-y-5">
        <section className="subtle-grid relative overflow-hidden rounded-2xl bg-[#102b38] p-5 text-white shadow-xl sm:p-6">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/18 to-transparent" />
          <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#72e1e3]">
                Team workspace
              </p>
              <h1 className="mt-2 text-2xl font-black">{team.name}</h1>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-300">
                <span>
                  Team ID: <strong className="font-mono text-white">{team.id}</strong>
                </span>
                <span>
                  Your role:{" "}
                  <strong className="capitalize text-white">{team.currentUserRole}</strong>
                </span>
                <span>
                  Members: <strong className="text-white">{team.members.length}</strong>
                </span>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                External invite code
              </p>
              <button
                onClick={copyInviteCode}
                className="flex max-w-full items-center gap-3 overflow-hidden rounded-lg border border-white/12 bg-white/8 px-4 py-2.5 font-mono text-sm font-bold transition hover:bg-white/12"
              >
                {team.inviteCode}
                <span className="material-symbols-outlined text-[17px]">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            </div>
          </div>
        </section>

        {canManageMembers && (
          <section className="section-panel p-5">
            <div className="mb-5">
              <h2 className="font-extrabold">Invite a new member</h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                The backend immediately adds an already registered user and assigns the default rep
                role.
              </p>
            </div>
            <form onSubmit={invite} className="flex flex-col gap-3 md:flex-row">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@company.com"
                required
                className="control h-11 flex-1 px-4 text-sm outline-none"
              />
              <button
                disabled={team.status === "loading"}
                className="primary-action h-11 disabled:opacity-60"
              >
                {team.status === "loading" ? "Adding..." : "Add registered user"}
              </button>
            </form>
            {team.error && (
              <p className="mt-3 rounded-lg bg-error/5 px-3 py-2 text-xs text-error">
                {team.error}
              </p>
            )}
            {team.message && (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {team.message}
              </p>
            )}
          </section>
        )}

        <section className="section-panel">
          <div className="border-b border-outline-variant/50 px-6 py-5">
            <h2 className="font-extrabold">Team members</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Admins can update roles or remove members from the workspace.
            </p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="soft-panel group relative overflow-hidden p-4 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="absolute right-[-30px] top-[-36px] h-24 w-24 rounded-full bg-primary/8 blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-primary text-xs font-bold text-white shadow-md shadow-primary/15">
                    {member.name
                      .split(/[\s._-]+/)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-black capitalize">{member.name}</p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                        {member.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                      {member.email}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {member.joinedAt}
                    </p>
                  </div>
                </div>
                <div className="relative mt-4 flex items-center gap-2">
                  <select
                    value={member.role}
                    disabled={!isAdmin || member.id === auth.userId || !team.id}
                    onChange={(event) => {
                      const role = event.target.value as TeamRole;
                      if (!team.id || !auth.accessToken) {
                        dispatch(updateMemberRoleLocal({ userId: member.id, role }));
                        return;
                      }
                      void dispatch(
                        updateMemberRoleRemote({
                          teamId: team.id,
                          userId: member.id,
                          role,
                          accessToken: auth.accessToken,
                        }),
                      ).then((result) => {
                        if (updateMemberRoleRemote.rejected.match(result)) {
                          dispatch(updateMemberRoleLocal({ userId: member.id, role }));
                        }
                      });
                    }}
                    className="control h-9 min-h-9 flex-1 px-3 text-xs font-semibold capitalize disabled:bg-slate-50"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="rep">Sales rep</option>
                  </select>
                  {canManageMembers && member.id !== auth.userId && (
                    <button
                      onClick={() => {
                        if (!team.id || !auth.accessToken) {
                          dispatch(removeMemberLocal(member.id));
                          return;
                        }
                        void dispatch(
                          removeMemberRemote({
                            teamId: team.id,
                            userId: member.id,
                            accessToken: auth.accessToken,
                          }),
                        ).then((result) => {
                          if (removeMemberRemote.rejected.match(result)) {
                            dispatch(removeMemberLocal(member.id));
                          }
                        });
                      }}
                      className="icon-button text-error hover:bg-error/5 hover:text-error"
                      aria-label={`Remove ${member.name}`}
                    >
                      <span className="material-symbols-outlined text-[19px]">person_remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
