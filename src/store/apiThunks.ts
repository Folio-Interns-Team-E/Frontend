import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../lib/api";
import type { TeamRole } from "./appSlice";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

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
