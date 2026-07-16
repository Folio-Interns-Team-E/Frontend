import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  createTeamRemote,
  fetchTeamRemote,
  fetchMyTeams,
  inviteMemberRemote,
  joinTeamRemote,
  loginAccount,
  logoutAccount,
  registerAccount,
  removeMemberRemote,
  updateMemberRoleRemote,
  fetchOnboardingStatus,
  submitOnboardingRemote,
  fetchLeads,
  qualifyLeadRemote,
  discardLeadRemote,
  sendEmailRemote,
  draftEmailRemote,
  fetchMeetings,
  fetchProposals,
  updateProposalStatusRemote,
  updateProposalOutcomeRemote,
  reviseProposalRemote,
  fetchKnowledgeAssets,
  uploadKnowledgeAsset,
  sendChatMessage,
  fetchChatMessages,
  fetchOutreachLeads,
  fetchLeadEmails,
} from "./apiThunks";

export type LeadStatus =
  | "New"
  | "Analyzed"
  | "Qualified"
  | "Discarded"
  | "Drafted"
  | "Sent"
  | "Replied";

export type Lead = {
  id: string;
  initials: string;
  name: string;
  company: string;
  title: string;
  email: string;
  source: string;
  score: number | null;
  status: LeadStatus;
  reasoning: string;
  createdAt: string;
};

export type Meeting = {
  id: string;
  leadId: string;
  client: string;
  company: string;
  date: string;
  time: string;
  duration: string;
  agenda: string[];
  status: "Upcoming" | "Live" | "Completed";
  transcript: string[];
  notes?: string;
  createdAt: string;
};

export type Proposal = {
  id: string;
  status: "Draft" | "Sent" | "Under Review" | "Accepted" | "Rejected";
  outcome: "Open" | "Won" | "Lost";
  updatedAt: string;
  presignedUrl?: string;
  fileType?: string;
  fileSize?: number;
  version: number;
  title: string;
  summary: string;
};

export type ProposalTemplate = {
  companyName: string;
  templateName: string;
  logoDataUrl: string | null;
  updatedAt: string | null;
};

export type TeamRole = "admin" | "manager" | "rep";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "Active";
  joinedAt: string;
};

type AssistantMessage = {
  id: string;
  author: "user" | "assistant";
  body: string;
  time: string;
};

type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  action?: "team_invite";
  inviteCode?: string;
};

type AppState = {
  auth: {
    registered: boolean;
    loggedIn: boolean;
    teamChoiceCompleted: boolean;
    accessToken: string | null;
    userId: string | null;
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
    userTeams: { id: string; name: string; role: "admin" | "manager" | "rep" }[];
    userTeamsStatus: "idle" | "loading" | "succeeded" | "failed";
  };
  onboarding: {
    completed: boolean;
    icp: string;
  };
  profile: {
    name: string;
    company: string;
    role: string;
    email: string;
  };
  integrations: {
    gmail: boolean;
    calendar: boolean;
    apollo: boolean;
  };
  team: {
    id: string | null;
    name: string | null;
    inviteCode: string | null;
    currentUserRole: TeamRole | null;
    members: TeamMember[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
    message: string | null;
  };
  leads: Lead[];
  leadsStatus: "idle" | "loading" | "succeeded" | "failed";
  notifications: Notification[];
  meetings: Meeting[];
  meetingsStatus: "idle" | "loading" | "succeeded" | "failed";
  selectedMeetingId: string | null;
  proposalTemplate: ProposalTemplate;
  proposals: Proposal[];
  proposalsStatus: "idle" | "loading" | "succeeded" | "failed";
  assistantMessages: AssistantMessage[];
  knowledgeAssets: {
    id: string;
    title: string;
    description?: string;
    tags: string[];
    fileType?: string;
    fileSize?: number;
    presignedUrl?: string;
    createdAt: string;
  }[];
  knowledgeAssetsStatus: "idle" | "loading" | "succeeded" | "failed";
  outreachLeads: Lead[];
  outreachLeadsStatus: "idle" | "loading" | "succeeded" | "failed";
  leadDraftEmails: Record<string, { subject: string; body: string }>;
  sidebarOpen: boolean;
};

export const initialState: AppState = {
  auth: {
    registered: false,
    loggedIn: false,
    teamChoiceCompleted: false,
    accessToken: null,
    userId: null,
    status: "idle",
    error: null,
    userTeams: [],
    userTeamsStatus: "idle",
  },
  onboarding: {
    completed: false,
    icp: "",
  },
  profile: {
    name: "",
    company: "",
    role: "",
    email: "",
  },
  integrations: {
    gmail: false,
    calendar: false,
    apollo: false,
  },
  team: {
    id: null,
    name: null,
    inviteCode: null,
    currentUserRole: null,
    members: [],
    status: "idle",
    error: null,
    message: null,
  },
  leads: [],
  leadsStatus: "idle",
  notifications: [],
  meetings: [],
  meetingsStatus: "idle",
  selectedMeetingId: null,
  proposalTemplate: {
    companyName: "",
    templateName: "",
    logoDataUrl: null,
    updatedAt: null,
  },
  proposals: [],
  proposalsStatus: "idle",
  assistantMessages: [],
  knowledgeAssets: [],
  knowledgeAssetsStatus: "idle",
  outreachLeads: [],
  outreachLeadsStatus: "idle",
  leadDraftEmails: {},
  sidebarOpen: true,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    skipTeamSetup(state) {
      state.auth.teamChoiceCompleted = true;
    },
    setActiveTeam(
      state,
      action: PayloadAction<{ id: string; name: string; role: "admin" | "manager" | "rep" }>,
    ) {
      state.team.id = action.payload.id;
      state.team.name = action.payload.name;
      state.team.currentUserRole = action.payload.role;
      state.auth.teamChoiceCompleted = true;
    },
    openSidebar(state) {
      state.sidebarOpen = true;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    demoRegister(
      state,
      action: PayloadAction<{ fullName: string; email: string; password: string }>,
    ) {
      state.auth.registered = true;
      state.auth.status = "succeeded";
      state.auth.error = null;
      state.auth.accessToken = `demo-token-${Date.now()}`;
      state.auth.userId = `demo-user-${Date.now()}`;
      state.profile.name = action.payload.fullName;
      state.profile.email = action.payload.email;
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: "Demo account created",
        body: "This account is stored in your browser until the backend is connected.",
        time: "Now",
        unread: true,
      });
    },
    demoLogin(state, action: PayloadAction<{ email: string; fullName?: string }>) {
      state.auth.loggedIn = true;
      state.auth.registered = true;
      state.auth.status = "succeeded";
      state.auth.error = null;
      state.auth.accessToken = state.auth.accessToken ?? `demo-token-${Date.now()}`;
      state.auth.userId = state.auth.userId ?? `demo-user-${Date.now()}`;
      state.profile.email = action.payload.email;
      state.profile.name =
        action.payload.fullName || state.profile.name || action.payload.email.split("@")[0];
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: "Signed in with demo mode",
        body: "Frontend-only functionality is enabled. Backend calls will still be used when available.",
        time: "Now",
        unread: true,
      });
    },
    demoLogout(state) {
      state.auth.loggedIn = false;
      state.auth.accessToken = null;
      state.auth.userId = null;
    },
    clearApiFeedback(state) {
      state.auth.error = null;
      state.team.error = null;
      state.team.message = null;
    },
    completeOnboarding(state, action: PayloadAction<{ icp: string }>) {
      state.onboarding.icp = action.payload.icp;
      state.onboarding.completed = true;
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: "ICP updated",
        body: "Lead scores will now use the latest customer profile.",
        time: "Now",
        unread: true,
      });
    },
    generateLeadsFromIcp(state) {
      state.leads = buildLeads(state.onboarding.icp).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: "ICP-matched leads generated",
        body: `${state.leads.filter((lead) => (lead.score ?? -1) >= 80).length} high-fit leads are ready for review.`,
        time: "Now",
        unread: true,
      });
    },
    qualifyLead(state, action: PayloadAction<string>) {
      const lead = state.leads.find((item) => item.id === action.payload);
      if (lead) lead.status = "Qualified";
    },
    discardLead(state, action: PayloadAction<string>) {
      const lead = state.leads.find((item) => item.id === action.payload);
      if (lead) lead.status = "Discarded";
    },
    draftEmail(state, action: PayloadAction<string>) {
      const lead = state.leads.find((item) => item.id === action.payload);
      if (lead) lead.status = "Drafted";
    },
    sendEmail(state, action: PayloadAction<string>) {
      const lead = state.leads.find((item) => item.id === action.payload);
      if (lead) lead.status = "Sent";
    },
    selectMeeting(state, action: PayloadAction<string>) {
      state.selectedMeetingId = action.payload;
    },
    setIntegration(
      state,
      action: PayloadAction<{ integration: keyof AppState["integrations"]; connected: boolean }>,
    ) {
      state.integrations[action.payload.integration] = action.payload.connected;
    },
    updateProfile(state, action: PayloadAction<AppState["profile"]>) {
      state.profile = action.payload;
    },
    createTeamLocal(state, action: PayloadAction<{ name: string }>) {
      const userId = state.auth.userId ?? `demo-user-${Date.now()}`;
      state.auth.userId = userId;
      state.auth.teamChoiceCompleted = true;
      state.team.id = `team-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      state.team.name = action.payload.name;
      state.team.inviteCode = `${action.payload.name
        .replace(/[^a-z0-9]/gi, "")
        .slice(0, 5)
        .toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      state.team.currentUserRole = "admin";
      state.team.status = "succeeded";
      state.team.error = null;
      state.team.message = "Demo team created. You are the admin.";
      state.team.members = [
        {
          id: userId,
          name: state.profile.name,
          email: state.profile.email,
          role: "admin",
          status: "Active",
          joinedAt: "Owner",
        },
      ];
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: "Team created",
        body: `${action.payload.name} is ready. Share the invite code to simulate joining.`,
        time: "Now",
        unread: true,
      });
    },
    joinTeamLocal(state, action: PayloadAction<{ inviteCode: string }>) {
      const userId = state.auth.userId ?? `demo-user-${Date.now()}`;
      state.auth.userId = userId;
      state.auth.teamChoiceCompleted = true;
      state.team.id = `joined-${action.payload.inviteCode.toLowerCase()}`;
      state.team.name = "Joined Demo Team";
      state.team.inviteCode = action.payload.inviteCode.toUpperCase();
      state.team.currentUserRole = "rep";
      state.team.status = "succeeded";
      state.team.error = null;
      state.team.message = "Joined team in frontend demo mode.";
      state.team.members = [
        {
          id: "demo-admin",
          name: "Maya Chen",
          email: "maya@salessync.ai",
          role: "admin",
          status: "Active",
          joinedAt: "Admin",
        },
        {
          id: userId,
          name: state.profile.name,
          email: state.profile.email,
          role: "rep",
          status: "Active",
          joinedAt: "You",
        },
      ];
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: "Joined a team",
        body: "You joined as a sales rep. Admin-only controls are intentionally locked.",
        time: "Now",
        unread: true,
      });
    },
    inviteMemberLocal(state, action: PayloadAction<{ email: string }>) {
      const name = action.payload.email.split("@")[0].replace(/[._-]/g, " ");
      state.team.members.push({
        id: `member-${Date.now()}`,
        name,
        email: action.payload.email,
        role: "rep",
        status: "Active",
        joinedAt: "Just now",
      });
      state.team.message = "Demo member added as sales rep.";
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: "Member added",
        body: `${action.payload.email} was added as a rep in demo mode.`,
        time: "Now",
        unread: true,
      });
    },
    updateMemberRoleLocal(state, action: PayloadAction<{ userId: string; role: TeamRole }>) {
      const member = state.team.members.find((item) => item.id === action.payload.userId);
      if (member) {
        member.role = action.payload.role;
        state.team.message = `${member.name} is now ${action.payload.role}.`;
      }
    },
    removeMemberLocal(state, action: PayloadAction<string>) {
      state.team.members = state.team.members.filter((member) => member.id !== action.payload);
      state.team.message = "Demo member removed.";
    },
    markNotificationsRead(state) {
      state.notifications.forEach((notification) => {
        notification.unread = false;
      });
    },
    acceptNotificationInvite(state, action: PayloadAction<string>) {
      const notification = state.notifications.find((item) => item.id === action.payload);
      if (notification?.inviteCode) {
        state.auth.teamChoiceCompleted = true;
        state.team.id = `notification-${notification.inviteCode.toLowerCase()}`;
        state.team.name = "Notification Invite Team";
        state.team.inviteCode = notification.inviteCode;
        state.team.currentUserRole = "rep";
        state.team.message = "Accepted invitation from notifications.";
        notification.unread = false;
      }
    },
    updateProposalStatus(state, action: PayloadAction<{ id: string; status: Proposal["status"] }>) {
      const proposal = state.proposals.find((item) => item.id === action.payload.id);
      if (proposal) proposal.status = action.payload.status;
    },
    updateProposalOutcome(
      state,
      action: PayloadAction<{ id: string; outcome: Proposal["outcome"] }>,
    ) {
      const proposal = state.proposals.find((item) => item.id === action.payload.id);
      if (!proposal) return;

      proposal.outcome = action.payload.outcome;
      proposal.status =
        action.payload.outcome === "Won"
          ? "Accepted"
          : action.payload.outcome === "Lost"
            ? "Rejected"
            : proposal.status;
      proposal.updatedAt = "Now";
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: `Proposal marked ${action.payload.outcome.toLowerCase()}`,
        body: `"${proposal.title}" outcome set to ${action.payload.outcome}.`,
        time: "Now",
        unread: true,
      });
    },
    reviseProposal(
      state,
      action: PayloadAction<{
        id: string;
        title: string;
        summary: string;
        note: string;
      }>,
    ) {
      const proposal = state.proposals.find((item) => item.id === action.payload.id);
      if (!proposal) return;

      proposal.title = action.payload.title;
      proposal.summary = action.payload.summary;
      proposal.updatedAt = "Now";
      proposal.status = proposal.status === "Sent" ? "Under Review" : proposal.status;
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: "Proposal updated",
        body: `"${proposal.title}" has been updated.`,
        time: "Now",
        unread: true,
      });
    },
    updateProposalTemplate(state, action: PayloadAction<ProposalTemplate>) {
      state.proposalTemplate = {
        ...action.payload,
        companyName: action.payload.companyName.trim(),
        templateName: action.payload.templateName.trim(),
        updatedAt: "Now",
      };
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: "Proposal template updated",
        body: state.proposalTemplate.companyName
          ? `${state.proposalTemplate.companyName} branding will be used on proposal previews.`
          : "Generic SalesSync proposal branding will be used.",
        time: "Now",
        unread: true,
      });
    },
    resetProposalTemplate(state) {
      state.proposalTemplate = {
        companyName: "",
        templateName: "",
        logoDataUrl: null,
        updatedAt: "Now",
      };
      state.notifications.unshift({
        id: `notification-${Date.now()}`,
        title: "Generic proposal template enabled",
        body: "Proposal previews will use the default SalesSync AI template.",
        time: "Now",
        unread: true,
      });
    },
  },
  extraReducers: (builder) => {
    const authPending = (state: AppState) => {
      state.auth.status = "loading";
      state.auth.error = null;
    };
    const authRejected = (state: AppState, action: { payload?: unknown }) => {
      state.auth.status = "failed";
      state.auth.error =
        typeof action.payload === "string" ? action.payload : "Authentication request failed";
    };
    const teamPending = (state: AppState) => {
      state.team.status = "loading";
      state.team.error = null;
      state.team.message = null;
    };
    const teamRejected = (state: AppState, action: { payload?: unknown }) => {
      state.team.status = "failed";
      state.team.error =
        typeof action.payload === "string" ? action.payload : "Team request failed";
    };
    const applyTeam = (
      state: AppState,
      team: {
        id: string;
        name: string;
        invite_code: string;
        members: { id: string; full_name: string; email: string; role: TeamRole }[];
      },
    ) => {
      state.team.id = team.id;
      state.team.name = team.name;
      state.team.inviteCode = team.invite_code;
      state.team.members = team.members.map((member) => ({
        id: member.id,
        name: member.full_name,
        email: member.email,
        role: member.role,
        status: "Active",
        joinedAt: "Member",
      }));
      state.team.currentUserRole =
        team.members.find((member) => member.id === state.auth.userId)?.role ?? null;
      state.team.status = "succeeded";
      state.auth.teamChoiceCompleted = true;
    };
    const toProposal = (p: {
      id: string;
      status: string;
      outcome: string;
      file_type?: string;
      file_size?: number;
      version: number;
      ai_metadata?: Record<string, unknown>;
      presigned_url?: string;
      updated_at: string;
    }): Proposal => {
      const meta = p.ai_metadata || {};
      return {
        id: p.id,
        status: p.status as Proposal["status"],
        outcome: p.outcome as Proposal["outcome"],
        updatedAt: p.updated_at,
        presignedUrl: p.presigned_url,
        fileType: p.file_type,
        fileSize: p.file_size,
        version: p.version,
        title: (meta.document_title as string) || "Proposal",
        summary: (meta.executive_summary as string) || "",
      };
    };
    const applyProposal = (
      state: AppState,
      proposal: Parameters<typeof toProposal>[0] | null,
    ) => {
      if (!proposal) return;
      const formatted = toProposal(proposal);
      const index = state.proposals.findIndex((item) => item.id === formatted.id);
      if (index >= 0) {
        state.proposals[index] = formatted;
      } else {
        state.proposals.unshift(formatted);
      }
      state.proposalsStatus = "succeeded";
    };

    builder
      .addCase(registerAccount.pending, authPending)
      .addCase(registerAccount.rejected, authRejected)
      .addCase(registerAccount.fulfilled, (state, action) => {
        state.auth.status = "succeeded";
        state.auth.registered = true;
        state.auth.accessToken = action.payload.access_token;
        state.auth.userId = action.payload.user_id;
        state.profile.name = action.payload.full_name;
        state.profile.email = action.payload.email;
      })
      .addCase(fetchMyTeams.pending, (state) => {
        state.auth.userTeamsStatus = "loading";
      })
      .addCase(fetchMyTeams.rejected, (state) => {
        state.auth.userTeamsStatus = "failed";
      })
      .addCase(fetchMyTeams.fulfilled, (state, action) => {
        state.auth.userTeamsStatus = "succeeded";
        state.auth.userTeams = action.payload.map((t) => ({
          id: t.id,
          name: t.name,
          role: t.role,
        }));
      })
      .addCase(loginAccount.pending, authPending)
      .addCase(loginAccount.rejected, authRejected)
      .addCase(loginAccount.fulfilled, (state, action) => {
        state.auth.status = "succeeded";
        state.auth.loggedIn = true;
        state.auth.accessToken = action.payload.access_token;
        state.auth.userId = action.payload.user_id;
        state.profile.name = action.payload.full_name;
        state.profile.email = action.payload.email;
        // backend doesn't return teamChoiceCompleted; keep existing value
      })
      .addCase(logoutAccount.fulfilled, (state) => {
        state.auth.loggedIn = false;
        state.auth.accessToken = null;
        state.auth.userId = null;
      })
      .addCase(createTeamRemote.pending, teamPending)
      .addCase(createTeamRemote.rejected, teamRejected)
      .addCase(createTeamRemote.fulfilled, (state, action) => {
        applyTeam(state, action.payload);
        state.team.currentUserRole = "admin";
        state.team.message = "Team created successfully.";
      })
      .addCase(joinTeamRemote.pending, teamPending)
      .addCase(joinTeamRemote.rejected, teamRejected)
      .addCase(joinTeamRemote.fulfilled, (state, action) => {
        applyTeam(state, action.payload);
        state.team.currentUserRole = "rep";
        state.team.message = "Successfully joined team.";
      })
      .addCase(fetchTeamRemote.pending, teamPending)
      .addCase(fetchTeamRemote.rejected, teamRejected)
      .addCase(fetchTeamRemote.fulfilled, (state, action) => applyTeam(state, action.payload))
      .addCase(inviteMemberRemote.pending, teamPending)
      .addCase(inviteMemberRemote.rejected, teamRejected)
      .addCase(inviteMemberRemote.fulfilled, (state) => {
        state.team.status = "succeeded";
        state.team.message = "Team member added successfully.";
      })
      .addCase(updateMemberRoleRemote.pending, teamPending)
      .addCase(updateMemberRoleRemote.rejected, teamRejected)
      .addCase(updateMemberRoleRemote.fulfilled, (state, action) => {
        const member = state.team.members.find((item) => item.id === action.payload.userId);
        if (member) member.role = action.payload.role;
        state.team.status = "succeeded";
        state.team.message = "Member role updated.";
      })
      .addCase(removeMemberRemote.pending, teamPending)
      .addCase(removeMemberRemote.rejected, teamRejected)
      .addCase(removeMemberRemote.fulfilled, (state, action) => {
        state.team.members = state.team.members.filter((item) => item.id !== action.payload);
        state.team.status = "succeeded";
        state.team.message = "Member removed.";
      })

      // === Onboarding ===
      .addCase(fetchOnboardingStatus.fulfilled, (state, action) => {
        const icp = action.payload.icp || "";
        try {
          const data = JSON.parse(icp);
          state.onboarding.icp = data.productDescription || data.icp || "";
        } catch {
          state.onboarding.icp = icp;
        }
        state.onboarding.completed = action.payload.completed;
      })
      .addCase(submitOnboardingRemote.fulfilled, (state, action) => {
        try {
          const data = JSON.parse(action.payload.icp);
          state.onboarding.icp = data.productDescription || data.icp || "";
          state.onboarding.completed = action.payload.completed;
        } catch {
          state.onboarding.icp = action.payload.icp;
          state.onboarding.completed = action.payload.completed;
        }
      })

      // === Leads ===
      .addCase(fetchLeads.pending, (state) => {
        state.leadsStatus = "loading";
      })
      .addCase(fetchLeads.rejected, (state) => {
        state.leadsStatus = "failed";
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.leads = action.payload.map((lead) => ({
          id: lead.id,
          initials: (lead.name || "")
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          name: lead.name,
          company: lead.company || "",
          title: lead.title || "",
          email: lead.email || "",
          source: lead.source || "",
          score: lead.score ?? null,
          status: lead.status as LeadStatus,
          reasoning: lead.reasoning || "",
          createdAt: lead.created_at,
        }));
        state.leadsStatus = "succeeded";
      })
      .addCase(qualifyLeadRemote.fulfilled, (state, action) => {
        const lead = state.leads.find((item) => item.id === action.payload.id);
        if (lead) lead.status = "Qualified";
        const oLead = state.outreachLeads.find((item) => item.id === action.payload.id);
        if (oLead) oLead.status = "Qualified";
      })
      .addCase(qualifyLeadRemote.pending, (state, action) => {
        const lead = state.leads.find((item) => item.id === action.meta.arg);
        if (lead) lead.status = "Qualified";
        const outreachLead = state.outreachLeads.find((item) => item.id === action.meta.arg);
        if (outreachLead) outreachLead.status = "Qualified";
      })
      .addCase(discardLeadRemote.fulfilled, (state, action) => {
        const lead = state.leads.find((item) => item.id === action.payload.id);
        if (lead) lead.status = "Discarded";
        state.outreachLeads = state.outreachLeads.filter((item) => item.id !== action.payload.id);
      })
      .addCase(discardLeadRemote.pending, (state, action) => {
        const lead = state.leads.find((item) => item.id === action.meta.arg);
        if (lead) lead.status = "Discarded";
        state.outreachLeads = state.outreachLeads.filter((item) => item.id !== action.meta.arg);
      })

      // === Outreach ===
      .addCase(fetchOutreachLeads.pending, (state) => {
        state.outreachLeadsStatus = "loading";
      })
      .addCase(fetchOutreachLeads.rejected, (state) => {
        state.outreachLeadsStatus = "failed";
      })
      .addCase(fetchOutreachLeads.fulfilled, (state, action) => {
        state.outreachLeads = action.payload.map((lead) => ({
          id: lead.id,
          initials: (lead.name || "")
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          name: lead.name,
          company: lead.company || "",
          title: lead.title || "",
          email: lead.email || "",
          source: lead.source || "",
          score: lead.score ?? null,
          status: lead.status as LeadStatus,
          reasoning: lead.reasoning || "",
          createdAt: lead.created_at,
        }));
        state.outreachLeadsStatus = "succeeded";
      })
      .addCase(fetchLeadEmails.fulfilled, (state, action) => {
        const { leadId, emails } = action.payload;
        const draft = emails.find((e) => e.status.toLowerCase() === "draft");
        if (draft) {
          state.leadDraftEmails[leadId] = { subject: draft.subject, body: draft.body };
        } else if (emails.length > 0) {
          const latest = emails[0];
          state.leadDraftEmails[leadId] = { subject: latest.subject, body: latest.body };
        } else {
          state.leadDraftEmails[leadId] = { subject: "", body: "" };
        }
      })

      // === Emails ===
      .addCase(sendEmailRemote.pending, (state, action) => {
        const lead = state.leads.find((item) => item.id === action.meta.arg.leadId);
        if (lead) lead.status = "Sent";
        const outreachLead = state.outreachLeads.find((item) => item.id === action.meta.arg.leadId);
        if (outreachLead) outreachLead.status = "Sent";
      })
      .addCase(sendEmailRemote.fulfilled, (state, action) => {
        const lead = state.leads.find((item) => item.id === action.payload.leadId);
        if (lead) lead.status = "Sent";
        const oLead = state.outreachLeads.find((item) => item.id === action.payload.leadId);
        if (oLead) oLead.status = "Sent";
        state.leadDraftEmails[action.payload.leadId] = {
          subject: action.payload.subject,
          body: action.payload.body,
        };
      })
      .addCase(draftEmailRemote.pending, (state, action) => {
        const lead = state.leads.find((item) => item.id === action.meta.arg.leadId);
        if (lead) lead.status = "Drafted";
        const outreachLead = state.outreachLeads.find((item) => item.id === action.meta.arg.leadId);
        if (outreachLead) outreachLead.status = "Drafted";
      })
      .addCase(draftEmailRemote.fulfilled, (state, action) => {
        const lead = state.leads.find((item) => item.id === action.payload.leadId);
        if (lead) lead.status = "Drafted";
        const oLead = state.outreachLeads.find((item) => item.id === action.payload.leadId);
        if (oLead) oLead.status = "Drafted";
      })

      // === Meetings ===
      .addCase(fetchMeetings.pending, (state) => {
        state.meetingsStatus = "loading";
      })
      .addCase(fetchMeetings.rejected, (state) => {
        state.meetingsStatus = "failed";
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.meetings = action.payload.map((m) => ({
          id: m.id,
          leadId: m.lead_id,
          client: m.client || "",
          company: m.company || "",
          date: m.date,
          time: m.time,
          duration: m.duration || "30 min",
          agenda: Array.isArray(m.agenda)
            ? m.agenda
            : m.agenda
              ? [m.agenda]
              : [],
          status: m.status as "Upcoming" | "Live" | "Completed",
          transcript: m.transcript ?? [],
          notes: m.notes,
          createdAt: m.created_at,
        }));
        state.meetingsStatus = "succeeded";
      })

      // === Proposals ===
      .addCase(fetchProposals.pending, (state) => {
        state.proposalsStatus = "loading";
      })
      .addCase(fetchProposals.rejected, (state) => {
        state.proposalsStatus = "failed";
      })
      .addCase(fetchProposals.fulfilled, (state, action) => {
        state.proposals = action.payload.map(toProposal);
        state.proposalsStatus = "succeeded";
      })
      .addCase(updateProposalStatusRemote.fulfilled, (state, action) => {
        applyProposal(state, action.payload);
      })
      .addCase(updateProposalStatusRemote.pending, (state, action) => {
        const proposal = state.proposals.find((item) => item.id === action.meta.arg.id);
        if (proposal) proposal.status = action.meta.arg.status as Proposal["status"];
      })
      .addCase(updateProposalOutcomeRemote.fulfilled, (state, action) => {
        applyProposal(state, action.payload);
      })
      .addCase(updateProposalOutcomeRemote.pending, (state, action) => {
        const proposal = state.proposals.find((item) => item.id === action.meta.arg.id);
        if (!proposal) return;
        proposal.outcome = action.meta.arg.outcome as Proposal["outcome"];
        proposal.status =
          action.meta.arg.outcome === "Won"
            ? "Accepted"
            : action.meta.arg.outcome === "Lost"
              ? "Rejected"
              : proposal.status;
      })
      .addCase(reviseProposalRemote.fulfilled, (state, action) => {
        applyProposal(state, action.payload);
      })

      // === Knowledge Base ===
      .addCase(fetchKnowledgeAssets.pending, (state) => {
        state.knowledgeAssetsStatus = "loading";
      })
      .addCase(fetchKnowledgeAssets.rejected, (state) => {
        state.knowledgeAssetsStatus = "failed";
      })
      .addCase(fetchKnowledgeAssets.fulfilled, (state, action) => {
        state.knowledgeAssets = action.payload.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          tags: a.tags || [],
          fileType: a.file_type,
          fileSize: a.file_size,
          presignedUrl: a.presigned_url,
          createdAt: a.created_at,
        }));
        state.knowledgeAssetsStatus = "succeeded";
      })
      .addCase(uploadKnowledgeAsset.fulfilled, (state, action) => {
        state.knowledgeAssets.unshift({
          id: action.payload.id,
          title: action.payload.title,
          description: action.payload.description,
          tags: action.payload.tags || [],
          fileType: action.payload.file_type,
          fileSize: action.payload.file_size,
          presignedUrl: action.payload.presigned_url,
          createdAt: action.payload.created_at,
        });
      })

      // === Chat ===
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.assistantMessages = [...action.payload]
          .reverse()
          .map((message) => ({
            id: message.id,
            author: message.sent_by === "user" ? "user" : "assistant",
            body: message.content,
            time: new Date(message.created_at).toLocaleString(),
          }));
      })
      .addCase(sendChatMessage.pending, (state, action) => {
        state.assistantMessages.push({
          id: `user-${Date.now()}`,
          author: "user",
          body: action.meta.arg,
          time: "Now",
        });
        state.assistantMessages.push({
          id: `assistant-${Date.now()}`,
          author: "assistant",
          body: "Thinking...",
          time: "Now",
        });
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.assistantMessages = [...action.payload]
          .reverse()
          .map((message) => ({
            id: message.id,
            author: message.sent_by === "user" ? "user" : "assistant",
            body: message.content,
            time: new Date(message.created_at).toLocaleString(),
          }));
      })
      .addCase(sendChatMessage.rejected, (state) => {
        const msgs = state.assistantMessages;
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].author === "assistant" && msgs[i].body === "Thinking...") {
            msgs[i] = {
              id: `assistant-${Date.now()}`,
              author: "assistant",
              body: "Sorry, I couldn't process that request. Please check your backend connection and try again.",
              time: "Now",
            };
            break;
          }
        }
      });
  },
});

export const {
  acceptNotificationInvite,
  clearApiFeedback,
  closeSidebar,
  completeOnboarding,
  createTeamLocal,
  demoLogin,
  demoLogout,
  demoRegister,
  discardLead,
  draftEmail,
  generateLeadsFromIcp,
  inviteMemberLocal,
  joinTeamLocal,
  markNotificationsRead,
  openSidebar,
  qualifyLead,
  removeMemberLocal,
  resetProposalTemplate,
  setActiveTeam,
  toggleSidebar,
  updateProposalTemplate,
  selectMeeting,
  sendEmail,
  setIntegration,
  skipTeamSetup,
  updateMemberRoleLocal,
  updateProfile,
  reviseProposal,
  updateProposalOutcome,
  updateProposalStatus,
} = appSlice.actions;

export default appSlice.reducer;

export function buildLeads(icp: string): Lead[] {
  const hasMatch = icp.length > 10;
  const baseScore = hasMatch ? 78 : 60;

  const prospects = [
    ["Maya Chen", "RevPilot", "VP of Sales", "maya@revpilot.io", "Apollo", 13],
    ["Omar Khan", "PipelineOS", "Revenue Operations Lead", "omar@pipelineos.co", "LinkedIn", 10],
    ["Nina Patel", "CloudForge", "Founder", "nina@cloudforge.dev", "Crunchbase", 8],
    ["Lucas Reed", "MetricFlow", "Sales Manager", "lucas@metricflow.ai", "Apollo", 5],
    ["Priya Shah", "CareLedger", "Operations Director", "priya@careledger.com", "Custom URL", -12],
    ["Jon Bell", "FinDock", "Engineering Manager", "jon@findock.example", "LinkedIn", -22],
  ] as const;

  return prospects.map(([name, company, title, email, source, delta], index) => {
    const score = Math.max(35, Math.min(99, baseScore + delta - index));
    return {
      id: `icp-lead-${index + 1}`,
      initials: name
        .split(" ")
        .map((part) => part[0])
        .join(""),
      name,
      company,
      title,
      email,
      source,
      score,
      status: score >= 80 ? "Analyzed" : "New",
      reasoning:
        score >= 80
          ? `${company} strongly matches your ICP description. ${title} is close to the revenue workflow.`
          : `${company} has partial fit, but the role or segment is weaker against your ICP.`,
      createdAt: new Date().toISOString(),
    };
  });
}
