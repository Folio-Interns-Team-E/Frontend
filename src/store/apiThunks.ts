import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../lib/api";
import type { TeamRole } from "./appSlice";
import type { RootState } from "./index";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

const getToken = () => localStorage.getItem("access_token");

export const registerAccount = createAsyncThunk(
  "app/registerAccount",
  async (payload: { fullName: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.register({
        full_name: payload.fullName,
        email: payload.email,
        password: payload.password,
      });
      const data = res.data ?? res;
      return { ...data, email: payload.email };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const loginAccount = createAsyncThunk(
  "app/loginAccount",
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.login(payload);

      const data = res.data ?? res;

      if (data.needs_verification) {
        return rejectWithValue({ needsVerification: true, email: payload.email });
      }

      const access_token = data.access_token;

      if (access_token && access_token !== "undefined") {
        localStorage.setItem("access_token", access_token);
      } else {
        localStorage.removeItem("access_token");
      }

      return data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const logoutAccount = createAsyncThunk(
  "app/logoutAccount",
  async (accessToken: string, { rejectWithValue }) => {
    try {
      await api.logout(accessToken);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const createTeamRemote = createAsyncThunk(
  "app/createTeamRemote",
  async (payload: { name: string; accessToken: string }, { rejectWithValue }) => {
    try {
      const res = await api.createTeam(payload.name, payload.accessToken);
      return res.data ?? res;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const joinTeamRemote = createAsyncThunk(
  "app/joinTeamRemote",
  async (payload: { inviteCode: string; accessToken: string }, { rejectWithValue }) => {
    try {
      const res = await api.joinTeam(payload.inviteCode, payload.accessToken);
      return res.data ?? res;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const fetchTeamRemote = createAsyncThunk(
  "app/fetchTeamRemote",
  async (payload: { teamId: string; accessToken: string }, { rejectWithValue }) => {
    try {
      const res = await api.getTeam(payload.teamId, payload.accessToken);
      return res.data ?? res;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const inviteMemberRemote = createAsyncThunk(
  "app/inviteMemberRemote",
  async (payload: { email: string; accessToken: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      return await api.inviteMember(payload.email, payload.accessToken, teamId);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const updateMemberRoleRemote = createAsyncThunk(
  "app/updateMemberRoleRemote",
  async (
    payload: {
      teamId: string;
      userId: string;
      role: TeamRole;
      accessToken: string;
    },
    { rejectWithValue },
  ) => {
    try {
      await api.updateMemberRole(payload.teamId, payload.userId, payload.role, payload.accessToken);
      return payload;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const fetchMyTeams = createAsyncThunk(
  "app/fetchMyTeams",
  async (accessToken: string, { rejectWithValue }) => {
    try {
      const res = await api.getMyTeams(accessToken);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const removeMemberRemote = createAsyncThunk(
  "app/removeMemberRemote",
  async (payload: { teamId: string; userId: string; accessToken: string }, { rejectWithValue }) => {
    try {
      await api.removeMember(payload.teamId, payload.userId, payload.accessToken);
      return payload.userId;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Onboarding Thunks ===
export const fetchOnboardingStatus = createAsyncThunk(
  "app/fetchOnboardingStatus",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.getOnboardingStatus(token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const submitOnboardingRemote = createAsyncThunk(
  "app/submitOnboardingRemote",
  async (payload: { icp: string }, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.submitOnboarding(
        {
          productName: "",
          productDescription: payload.icp,
          targetCustomer: "",
          goals: "",
        },
        token!,
        teamId,
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Leads Thunks ===
export const fetchLeads = createAsyncThunk(
  "app/fetchLeads",
  async (status: string | undefined, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.getLeads(status, token, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const createLeadRemote = createAsyncThunk(
  "app/createLeadRemote",
  async (
    payload: {
      name: string;
      company?: string;
      title?: string;
      email?: string;
      source?: string;
      status?: string;
      score?: number;
      reasoning?: string;
    },
    { rejectWithValue, getState },
  ) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.createLead(payload, token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const qualifyLeadRemote = createAsyncThunk(
  "app/qualifyLeadRemote",
  async (leadId: string, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.qualifyLead(leadId, token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const discardLeadRemote = createAsyncThunk(
  "app/discardLeadRemote",
  async (leadId: string, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      await api.deleteLead(leadId, token!, teamId);
      return leadId;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Email Thunks ===
export const sendEmailRemote = createAsyncThunk(
  "app/sendEmailRemote",
  async (
    payload: { leadId: string; subject: string; body: string; tone?: string },
    { rejectWithValue, getState },
  ) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.sendEmail(
        {
          lead_id: payload.leadId,
          subject: payload.subject,
          body: payload.body,
          tone: payload.tone,
        },
        token!,
        teamId,
      );
      return { leadId: payload.leadId, ...res.data };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const draftEmailRemote = createAsyncThunk(
  "app/draftEmailRemote",
  async (payload: { leadId: string; subject: string; body: string }, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.draftEmail(
        {
          lead_id: payload.leadId,
          subject: payload.subject,
          body: payload.body,
        },
        token!,
        teamId,
      );
      return { leadId: payload.leadId, ...res.data };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Outreach Thunks ===
export const fetchOutreachLeads = createAsyncThunk(
  "app/fetchOutreachLeads",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.getLeads(undefined, token, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const fetchLeadEmails = createAsyncThunk(
  "app/fetchLeadEmails",
  async (leadId: string, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.getEmails(leadId, token!, teamId);
      return { leadId, emails: res.data };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const deleteEmailRemote = createAsyncThunk(
  "app/deleteEmailRemote",
  async (payload: { emailId: string; leadId: string }, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      await api.deleteEmail(payload.emailId, token!, teamId);
      return payload;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Chat Thunks ===
export const fetchChats = createAsyncThunk(
  "app/fetchChats",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.listChats(token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const createChatRemote = createAsyncThunk(
  "app/createChatRemote",
  async (chatName: string, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.createChat(chatName, token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const renameChatRemote = createAsyncThunk(
  "app/renameChatRemote",
  async (payload: { chatId: string; chatName: string }, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.renameChat(payload.chatId, payload.chatName, token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const deleteChatRemote = createAsyncThunk(
  "app/deleteChatRemote",
  async (chatId: string, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      await api.deleteChat(chatId, token!, teamId);
      return chatId;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const sendChatMessage = createAsyncThunk(
  "app/sendChatMessage",
  async (message: string, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const chatId = state.app.activeChatId;
      if (!chatId) throw new Error("No active chat selected");
      await api.sendChat(message, token!, teamId, chatId);
      const res = await api.getChatMessages(token!, teamId, chatId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const fetchChatMessages = createAsyncThunk(
  "app/fetchChatMessages",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const chatId = state.app.activeChatId;
      if (!chatId) return [];
      const res = await api.getChatMessages(token!, teamId, chatId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Meetings Thunks ===
export const fetchMeetings = createAsyncThunk(
  "app/fetchMeetings",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.getMeetings(token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Proposals Thunks ===
export const fetchProposals = createAsyncThunk(
  "app/fetchProposals",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.getProposals(token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const updateProposalStatusRemote = createAsyncThunk(
  "app/updateProposalStatusRemote",
  async (payload: { id: string; status: string }, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.updateProposalStatus(payload.id, payload.status, token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const updateProposalOutcomeRemote = createAsyncThunk(
  "app/updateProposalOutcomeRemote",
  async (payload: { id: string; outcome: string }, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.updateProposalOutcome(payload.id, payload.outcome, token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const reviseProposalRemote = createAsyncThunk(
  "app/reviseProposalRemote",
  async (
    payload: { id: string; title: string; summary: string; value?: string; note?: string },
    { rejectWithValue, getState },
  ) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const val = payload.value ? parseFloat(payload.value.replace(/[^0-9.]/g, "")) : undefined;
      await api.addProposalRevision(
        payload.id,
        {
          title: payload.title,
          summary: payload.summary,
          value: val,
          note: payload.note,
        },
        token!,
        teamId,
      );
      const res = await api.getProposals(token!, teamId);
      return res.data.find((proposal) => proposal.id === payload.id) ?? null;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Knowledge Base Thunks ===
export const uploadKnowledgeAsset = createAsyncThunk(
  "app/uploadKnowledgeAsset",
  async (
    payload: { file: File; title: string; description?: string; tags?: string },
    { rejectWithValue, getState },
  ) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.uploadKnowledgeAsset(payload, token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const uploadProposalTemplate = createAsyncThunk(
  "app/uploadProposalTemplate",
  async (payload: { file: File; template_name: string }, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.uploadProposalTemplate(payload, token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const fetchKnowledgeAssets = createAsyncThunk(
  "app/fetchKnowledgeAssets",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.getKnowledgeAssets(token!, teamId);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const updateKnowledgeAsset = createAsyncThunk(
  "app/updateKnowledgeAsset",
  async (
    payload: { id: string; title?: string; description?: string; tags?: string[] },
    { rejectWithValue, getState },
  ) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      const res = await api.updateKnowledgeAsset(
        payload.id,
        { title: payload.title, description: payload.description, tags: payload.tags },
        token!,
        teamId,
      );
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const deleteKnowledgeAsset = createAsyncThunk(
  "app/deleteKnowledgeAsset",
  async (assetId: string, { rejectWithValue, getState }) => {
    try {
      const token = getToken();
      const state = getState() as RootState;
      const teamId = state.app.team.id;
      await api.deleteKnowledgeAsset(assetId, token!, teamId);
      return assetId;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === OTP Thunks ===
export const requestOtp = createAsyncThunk(
  "app/requestOtp",
  async (email: string, { rejectWithValue }) => {
    try {
      await api.requestOtp(email);
      return email;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "app/verifyOtp",
  async (payload: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      await api.verifyOtp(payload.email, payload.otp);
      return payload.email;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);