import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../lib/api";
import type { TeamRole } from "./appSlice";

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
      return res.data ?? res;
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

      console.log(res);

      const data = res.data ?? res;
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
  async (payload: { email: string; accessToken: string }, { rejectWithValue }) => {
    try {
      return await api.inviteMember(payload.email, payload.accessToken);
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
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await api.getOnboardingStatus(token!);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const submitOnboardingRemote = createAsyncThunk(
  "app/submitOnboardingRemote",
  async (payload: { icp: string }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await api.submitOnboarding(
        {
          productName: "",
          productDescription: payload.icp,
          targetCustomer: "",
          goals: "",
        },
        token!,
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
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await api.getLeads(status, token);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const qualifyLeadRemote = createAsyncThunk(
  "app/qualifyLeadRemote",
  async (leadId: string, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await api.qualifyLead(leadId, token!);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const discardLeadRemote = createAsyncThunk(
  "app/discardLeadRemote",
  async (leadId: string, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await api.discardLead(leadId, token!);
      return res.data;
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
    { rejectWithValue },
  ) => {
    try {
      const token = getToken();
      const res = await api.sendEmail(
        {
          lead_id: payload.leadId,
          subject: payload.subject,
          body: payload.body,
          tone: payload.tone,
        },
        token!,
      );
      return { leadId: payload.leadId, ...res.data };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const draftEmailRemote = createAsyncThunk(
  "app/draftEmailRemote",
  async (payload: { leadId: string; subject: string; body: string }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await api.draftEmail(
        {
          lead_id: payload.leadId,
          subject: payload.subject,
          body: payload.body,
        },
        token!,
      );
      return { leadId: payload.leadId, ...res.data };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Chat Thunks ===
export const sendChatMessage = createAsyncThunk(
  "app/sendChatMessage",
  async (message: string, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await api.sendChat(message, token!);
      return { userMessage: message, reply: res.data.reply };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Meetings Thunks ===
export const fetchMeetings = createAsyncThunk(
  "app/fetchMeetings",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await api.getMeetings(token!);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Proposals Thunks ===
export const fetchProposals = createAsyncThunk(
  "app/fetchProposals",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await api.getProposals(token!);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const updateProposalStatusRemote = createAsyncThunk(
  "app/updateProposalStatusRemote",
  async (payload: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const token = getToken();
      await api.updateProposal(payload.id, { status: payload.status }, token!);
      return { id: payload.id, status: payload.status };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const updateProposalOutcomeRemote = createAsyncThunk(
  "app/updateProposalOutcomeRemote",
  async (payload: { id: string; outcome: string }, { rejectWithValue }) => {
    try {
      const token = getToken();
      await api.updateProposal(payload.id, { outcome: payload.outcome }, token!);
      return { id: payload.id, outcome: payload.outcome };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const reviseProposalRemote = createAsyncThunk(
  "app/reviseProposalRemote",
  async (
    payload: { id: string; title: string; summary: string; value?: string; note?: string },
    { rejectWithValue },
  ) => {
    try {
      const token = getToken();
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
      );
      return payload;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

// === Knowledge Base Thunks ===
export const fetchKnowledgeAssets = createAsyncThunk(
  "app/fetchKnowledgeAssets",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await api.getKnowledgeAssets(token!);
      return res.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);
