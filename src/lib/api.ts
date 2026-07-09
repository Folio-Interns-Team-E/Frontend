export const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  full_name: string;
  email: string;
};

export type ApiMember = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "manager" | "rep";
};

export type ApiTeam = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  members: ApiMember[];
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      `Could not reach the API at ${API_URL}. Make sure FastAPI is running and CORS allows this frontend origin.`,
    );
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(data?.detail ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type ApiUserTeam = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  role: "admin" | "manager" | "rep";
};

export const api = {
  register(payload: { full_name: string; email: string; password: string }) {
    return request<{ data: AuthResponse }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string }) {
    return request<{ data: AuthResponse }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  logout(accessToken: string) {
    return request<{ data: unknown }>("/auth/logout", { method: "POST" }, accessToken);
  },
  createTeam(name: string, accessToken: string) {
    return request<{ data: ApiTeam }>(
      "/teams/",
      { method: "POST", body: JSON.stringify({ name }) },
      accessToken,
    );
  },
  joinTeam(inviteCode: string, accessToken: string) {
    return request<{ data: ApiTeam }>(
      "/teams/join",
      { method: "POST", body: JSON.stringify({ invite_code: inviteCode }) },
      accessToken,
    );
  },
  getTeam(teamId: string, accessToken: string) {
    return request<{ data: ApiTeam }>(`/teams/${teamId}`, {}, accessToken);
  },
  inviteMember(email: string, accessToken: string) {
    return request<{ data: ApiTeam }>(
      "/teams/invite",
      { method: "POST", body: JSON.stringify({ email }) },
      accessToken,
    );
  },
  updateMemberRole(
    teamId: string,
    userId: string,
    role: "admin" | "manager" | "rep",
    accessToken: string,
  ) {
    return request<{ data: { message: string } }>(
      `/teams/${teamId}/members/${userId}/role`,
      { method: "PUT", body: JSON.stringify({ role }) },
      accessToken,
    );
  },
  removeMember(teamId: string, userId: string, accessToken: string) {
    return request<{ data: unknown }>(
      `/teams/${teamId}/members/${userId}`,
      { method: "DELETE" },
      accessToken,
    );
  },
  getInviteCode(teamId: string, accessToken: string) {
    return request<{ data: { invite_code: string } }>(
      `/teams/${teamId}/invite-code`,
      {},
      accessToken,
    );
  },
  getMyTeams(accessToken: string) {
    return request<{ data: ApiUserTeam[] }>("/teams/", {}, accessToken);
  },

  // === Onboarding ===
  submitOnboarding(
    payload: {
      productName?: string;
      productDescription: string;
      targetCustomer: string;
      goals: string;
    },
    accessToken: string,
  ) {
    return request<{ data: { icp: string; completed: boolean } }>(
      "/onboarding/icp",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
    );
  },
  getOnboardingStatus(accessToken: string) {
    return request<{ data: { icp: string; completed: boolean } }>(
      "/onboarding/status",
      {},
      accessToken,
    );
  },

  // === Leads ===
  getLeads(status?: string, accessToken?: string | null) {
    const query = status ? `?status=${status}` : "";
    return request<{ data: LeadApi[] }>(`/leads/${query}`, {}, accessToken);
  },
  getLead(leadId: string, accessToken: string) {
    return request<{ data: LeadApi }>(`/leads/${leadId}`, {}, accessToken);
  },
  createLead(
    payload: { name: string; company?: string; title?: string; email?: string; source?: string },
    accessToken: string,
  ) {
    return request<{ data: LeadApi }>(
      "/leads/",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
    );
  },
  qualifyLead(leadId: string, accessToken: string) {
    return request<{ data: LeadApi }>(`/leads/${leadId}/qualify`, { method: "POST" }, accessToken);
  },
  discardLead(leadId: string, accessToken: string) {
    return request<{ data: LeadApi }>(`/leads/${leadId}/discard`, { method: "POST" }, accessToken);
  },

  // === Emails ===
  sendEmail(
    payload: { lead_id: string; subject: string; body: string; tone?: string },
    accessToken: string,
  ) {
    return request<{ data: EmailApi }>(
      "/emails/",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
    );
  },
  draftEmail(payload: { lead_id: string; subject: string; body: string }, accessToken: string) {
    return request<{ data: EmailApi }>(
      "/emails/draft",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
    );
  },
  getEmails(leadId: string, accessToken: string) {
    return request<{ data: EmailApi[] }>(`/emails/?lead_id=${leadId}`, {}, accessToken);
  },

  // === Meetings ===
  getMeetings(accessToken: string) {
    return request<{ data: MeetingApi[] }>("/meetings/", {}, accessToken);
  },
  createMeeting(
    payload: {
      lead_id?: string;
      client: string;
      company?: string;
      date: string;
      time: string;
      duration?: string;
      agenda?: string[];
    },
    accessToken: string,
  ) {
    return request<{ data: MeetingApi }>(
      "/meetings/",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
    );
  },
  updateMeeting(
    meetingId: string,
    payload: {
      status?: string;
      notes?: string;
      transcript?: string[];
      agenda?: string[];
    },
    accessToken: string,
  ) {
    return request<{ data: MeetingApi }>(
      `/meetings/${meetingId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      accessToken,
    );
  },

  // === Proposals ===
  getProposals(accessToken: string) {
    return request<{ data: ProposalApi[] }>("/proposals/", {}, accessToken);
  },
  createProposal(
    payload: {
      company: string;
      title?: string;
      summary?: string;
      value?: number;
      lead_id?: string;
    },
    accessToken: string,
  ) {
    return request<{ data: ProposalApi }>(
      "/proposals/",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
    );
  },
  updateProposal(
    proposalId: string,
    payload: {
      title?: string;
      summary?: string;
      value?: number;
      status?: string;
      outcome?: string;
    },
    accessToken: string,
  ) {
    return request<{ data: ProposalApi }>(
      `/proposals/${proposalId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      accessToken,
    );
  },
  addProposalRevision(
    proposalId: string,
    payload: {
      title: string;
      summary: string;
      value?: number;
      note?: string;
    },
    accessToken: string,
  ) {
    return request<{ data: unknown }>(
      `/proposals/${proposalId}/revisions`,
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
    );
  },
  getProposalTemplate(accessToken: string) {
    return request<{ data: ProposalTemplateApi }>("/proposals/template", {}, accessToken);
  },
  uploadProposalTemplate(payload: { file: File; template_name: string }, accessToken: string) {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("template_name", payload.template_name);
    return request<{ data: ProposalTemplateApi }>(
      "/proposals/template/upload",
      { method: "POST", body: formData },
      accessToken,
    );
  },

  // === Knowledge Base ===
  getKnowledgeAssets(accessToken: string) {
    return request<{ data: KnowledgeAssetApi[] }>("/knowledge-base/", {}, accessToken);
  },
  uploadKnowledgeAsset(
    payload: { file: File; title: string; description?: string; tags?: string },
    accessToken: string,
  ) {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("title", payload.title);
    if (payload.description) formData.append("description", payload.description);
    if (payload.tags) formData.append("tags", payload.tags);
    return request<{ data: KnowledgeAssetApi }>(
      "/knowledge-base/upload",
      { method: "POST", body: formData },
      accessToken,
    );
  },

  // === Integrations ===
  getGmailAuthUrl(accessToken: string) {
    return request<{ data: { url: string } }>("/integrations/gmail/auth-url", {}, accessToken);
  },
  getGmailStatus(accessToken: string) {
    return request<{ data: { connected: boolean; email?: string } }>(
      "/integrations/gmail/status",
      {},
      accessToken,
    );
  },
  sendChat(message: string, accessToken: string) {
    return request<{ data: { reply: string } }>(
      "/chat/",
      { method: "POST", body: JSON.stringify({ message }) },
      accessToken,
    );
  },
};

export type LeadApi = {
  id: string;
  name: string;
  email?: string;
  company?: string;
  title?: string;
  source?: string;
  score?: number;
  status: string;
  reasoning?: string;
  created_at: string;
};

export type EmailApi = {
  id: string;
  lead_id: string;
  subject: string;
  body: string;
  status: string;
  sent_at?: string;
};

export type MeetingApi = {
  id: string;
  client?: string;
  company?: string;
  date: string;
  time: string;
  duration?: string;
  agenda: string[];
  transcript: string[];
  status: string;
  notes?: string;
};

export type ProposalApi = {
  id: string;
  status: string;
  outcome: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  version: number;
  ai_metadata: Record<string, unknown>;
  presigned_url?: string;
  created_at: string;
  updated_at: string;
};

export type ProposalTemplateApi = {
  id: string;
  team_id: string;
  template_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  presigned_url?: string;
  created_at: string;
  updated_at?: string;
};

export type ProposalTemplateUploadPayload = {
  template_name: string;
  file: File;
};

export type KnowledgeAssetApi = {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  tags: string[];
  file_url: string;
  file_type?: string;
  file_size?: number;
  presigned_url?: string;
  created_at: string;
  updated_at?: string;
};
