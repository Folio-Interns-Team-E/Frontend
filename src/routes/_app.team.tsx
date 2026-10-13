import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { setActiveTeam, type TeamRole } from "../store/appSlice";
import {
  fetchMyTeams,
  fetchTeamRemote,
  inviteMemberRemote,
  joinTeamRemote,
  removeMemberRemote,
  updateMemberRoleRemote,
} from "../store/apiThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { api } from "../lib/api";

export const Route = createFileRoute("/_app/team")({
  head: () => ({ meta: [{ title: "Team management · SalesSync AI" }] }),
  component: TeamManagement,
});

function TeamManagement() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const team = useAppSelector((state) => state.app.team);
  const auth = useAppSelector((state) => state.app.auth);
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [rotateBusy, setRotateBusy] = useState(false);
  const [rotateError, setRotateError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const isAdmin = team.currentUserRole === "admin";
  const canManageMembers = team.currentUserRole === "admin" || team.currentUserRole === "manager";
  const inviteExpired = Boolean(
    team.inviteCodeExpiresAt && new Date(team.inviteCodeExpiresAt).getTime() <= Date.now(),
  );

  const accessToken = auth.accessToken;

  useEffect(() => {
    const token = accessToken && accessToken !== "undefined" ? accessToken : null;
    if (token && auth.userTeamsStatus === "idle") {
      dispatch(fetchMyTeams(token));
    }
  }, [accessToken, auth.userTeamsStatus, dispatch]);

  useEffect(() => {
    if (!team.id || !accessToken || accessToken === "undefined") return;
    dispatch(fetchTeamRemote({ teamId: team.id, accessToken }));
  }, [team.id, accessToken, dispatch]);

  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!auth.accessToken) return;
    const result = await dispatch(inviteMemberRemote({ email, accessToken: auth.accessToken }));
    if (inviteMemberRemote.fulfilled.match(result)) {
      setEmail("");
    }
  }

  async function joinTeam(event: FormEvent) {
    event.preventDefault();
    if (!auth.accessToken) return;
    const result = await dispatch(joinTeamRemote({ inviteCode, accessToken: auth.accessToken }));
    if (joinTeamRemote.fulfilled.match(result)) {
      setInviteCode("");
      dispatch(fetchMyTeams(auth.accessToken));
    }
  }

  async function switchTeam(teamId: string, teamName: string, role: TeamRole) {
    dispatch(setActiveTeam({ id: teamId, name: teamName, role }));
    if (auth.accessToken) {
      dispatch(fetchTeamRemote({ teamId, accessToken: auth.accessToken }));
    }
    navigate({ to: "/dashboard" });
  }

  function copyInviteCode() {
    if (!team.inviteCode || inviteExpired) return;
    void navigator.clipboard?.writeText(team.inviteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function rotateInviteCode() {
    if (!team.id || !auth.accessToken || !isAdmin) return;
    setRotateBusy(true);
    setRotateError("");
    try {
      await api.rotateInviteCode(team.id, auth.accessToken);
      await dispatch(fetchTeamRemote({ teamId: team.id, accessToken: auth.accessToken })).unwrap();
      setCopied(false);
      setRotateOpen(false);
    } catch (error) {
      setRotateError(error instanceof Error ? error.message : "Could not rotate the invite code.");
    } finally {
      setRotateBusy(false);
    }
  }

  async function changeRole(userId: string, role: TeamRole) {
    if (!isAdmin || !team.id || !auth.accessToken) return;
    setUpdatingRoleId(userId);
    setRoleError("");
    try {
      await dispatch(
        updateMemberRoleRemote({ teamId: team.id, userId, role, accessToken: auth.accessToken }),
      ).unwrap();
      await dispatch(fetchTeamRemote({ teamId: team.id, accessToken: auth.accessToken })).unwrap();
    } catch (error) {
      setRoleError(typeof error === "string" ? error : "Could not update member role");
    } finally {
      setUpdatingRoleId(null);
    }
  }

  function confirmRemoveMember() {
    if (!confirmRemove) return;
    if (!team.id || !auth.accessToken) return;
    void dispatch(
      removeMemberRemote({
        teamId: team.id,
        userId: confirmRemove.id,
        accessToken: auth.accessToken,
      }),
    );
    setConfirmRemove(null);
  }

  return (
    <>
      <TopBar title="Team management" />
      <div className="page-shell space-y-5">
        <section className="section-panel p-5">
          <div className="mb-5">
            <h2 className="font-extrabold">Your teams</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Select a team to manage or join a new one using an invite code.
            </p>
          </div>
          {auth.userTeams.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {auth.userTeams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => switchTeam(t.id, t.name, t.role)}
                  className={`app-card app-card-hover flex items-center gap-4 p-4 text-left transition ${
                    team.id === t.id ? "border-primary ring-2 ring-primary/10" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold text-white">
                    {t.name
                      .split(/[\s._-]+/)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-black">{t.name}</p>
                      {team.id === t.id && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs capitalize text-on-surface-variant">
                      Role: {t.role}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    arrow_forward_ios
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">
              You are not a member of any teams yet.
            </p>
          )}
        </section>

        <section className="section-panel p-5">
          <div className="mb-5">
            <h2 className="font-extrabold">Join a team</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Enter an invite code to join an existing team.
            </p>
          </div>
          <form onSubmit={joinTeam} className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="Enter invite code"
              required
              className="control h-11 flex-1 px-4 font-mono text-sm uppercase outline-none"
            />
            <button
              disabled={team.status === "loading" || !auth.accessToken}
              className="primary-action h-11 disabled:opacity-60"
            >
              {team.status === "loading" ? "Joining..." : "Join team"}
            </button>
          </form>
        </section>

        {team.id && (
          <>
            <section className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900 p-5 text-white sm:p-6">
              <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
                {isAdmin && team.inviteCode && (
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
                        <strong className="capitalize text-white">
                          {team.currentUserRole === "admin" ? team.currentUserRole : "member"}
                        </strong>
                      </span>
                      <span>
                        Members: <strong className="text-white">{team.members.length}</strong>
                      </span>
                    </div>
                  </div>
                )}
                {isAdmin && team.inviteCode && (
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      External invite code
                    </p>
                    <button
                      onClick={copyInviteCode}
                      disabled={inviteExpired}
                      className="flex max-w-full items-center gap-3 overflow-hidden rounded-lg border border-white/12 bg-white/8 px-4 py-2.5 font-mono text-sm font-bold transition hover:bg-white/12"
                    >
                      {team.inviteCode}
                      <span className="material-symbols-outlined text-[17px]">
                        {copied ? "check" : "content_copy"}
                      </span>
                    </button>
                    {team.inviteCodeExpiresAt && (
                      <p className="mt-2 text-xs text-slate-300">
                        {inviteExpired ? "Expired" : "Expires"}{" "}
                        {new Date(team.inviteCodeExpiresAt).toLocaleString()}
                      </p>
                    )}
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-[#72e1e3] underline-offset-2 hover:underline"
                      onClick={() => setRotateOpen(true)}
                    >
                      Rotate invite code
                    </button>
                  </div>
                )}
              </div>
            </section>

            {canManageMembers && (
              <section className="section-panel p-5">
                <div className="mb-5">
                  <h2 className="font-extrabold">Invite a new member</h2>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Send an email invitation with a link to join your team.
                  </p>
                  {inviteExpired && (
                    <p className="mt-2 text-xs text-error">
                      Invite code expired. Ask a workspace admin to rotate it before sending
                      invitations.
                    </p>
                  )}
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
                    disabled={team.status === "loading" || inviteExpired}
                    className="primary-action h-11 disabled:opacity-60"
                  >
                    {team.status === "loading" ? "Sending..." : "Send invite"}
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
                {roleError && (
                  <p role="alert" className="mt-2 text-xs text-error">
                    {roleError}
                  </p>
                )}
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="soft-panel group relative overflow-hidden p-4 transition-colors hover:border-slate-400"
                  >
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold text-white">
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
                      {isAdmin && member.id !== auth.userId ? (
                        <select
                          aria-label={`Role for ${member.name}`}
                          className="control h-9 flex-1 px-3 text-xs font-semibold capitalize"
                          value={member.role}
                          disabled={updatingRoleId === member.id}
                          onChange={(event) =>
                            void changeRole(member.id, event.target.value as TeamRole)
                          }
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="rep">Rep</option>
                        </select>
                      ) : (
                        <div className="control flex h-9 flex-1 items-center px-3 text-xs font-semibold capitalize">
                          {member.role}
                        </div>
                      )}
                      {canManageMembers &&
                        member.id !== auth.userId &&
                        (isAdmin || member.role === "rep") && (
                          <button
                            onClick={() => setConfirmRemove({ id: member.id, name: member.name })}
                            className="icon-button text-error hover:bg-error/5 hover:text-error"
                            aria-label={`Remove ${member.name}`}
                          >
                            <span className="material-symbols-outlined text-[19px]">
                              person_remove
                            </span>
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      {rotateOpen && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal-surface w-full max-w-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rotate-invite-title"
          >
            <div className="space-y-3 p-5">
              <h2 id="rotate-invite-title" className="text-lg font-bold">
                Rotate invite code?
              </h2>
              <p className="text-sm text-on-surface-variant">
                The current code and all invitation links containing it will stop working. Team
                members already joined will keep access.
              </p>
              {rotateError && (
                <p role="alert" className="text-sm text-error">
                  {rotateError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="secondary-action"
                  disabled={rotateBusy}
                  onClick={() => setRotateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-action"
                  disabled={rotateBusy}
                  onClick={() => void rotateInviteCode()}
                >
                  {rotateBusy ? "Rotating..." : "Rotate code"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="text-base font-black text-slate-900">Remove member</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to remove <strong>{confirmRemove.name}</strong> from this team?
              They will lose access to all team data.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveMember}
                className="rounded-lg bg-error px-4 py-2 text-sm font-bold text-white transition hover:bg-error/90"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
