export const API_URL = import.meta.env.DEV ? "/api" : (import.meta.env.VITE_API_URL ?? "/api");

let currentAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getAccessToken() {
  return currentAccessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "X-SalesSync-Request": "1" },
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as { data?: { access_token?: string } };
        const token = body.data?.access_token ?? null;
        setAccessToken(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user_id: string;
  full_name: string;
  email: string;
  needs_verification?: boolean;
};

export type SecurityEventApi = {
  id: string;
  action:
    | "password_login"
    | "password_reset"
    | "google_login"
    | "github_login"
    | "google_linked"
    | "github_linked";
  created_at: string;
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
  invite_code?: string | null;
  created_at: string;
  members: ApiMember[];
};

export type OpportunityStage =
  "Prospecting" | "Qualification" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";

export type OpportunityApi = {
  id: string;
  team_id: string;
  lead_id: string | null;
  owner_id: string | null;
  owner_name: string | null;
  name: string;
  company_name: string;
  stage: OpportunityStage;
  amount: string;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  loss_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityPayload = {
  name: string;
  company_name: string;
  lead_id?: string | null;
  owner_id?: string | null;
  stage?: OpportunityStage;
  amount?: number;
  currency?: string;
  probability?: number;
  expected_close_date?: string | null;
  loss_reason?: string | null;
  notes?: string | null;
};

export type OpportunitySummaryApi = {
  total_count: number;
  open_count: number;
  won_count: number;
  lost_count: number;
  pipeline_value: string;
  weighted_value: string;
  won_value: string;
};

export type AccountApi = {
  id: string;
  team_id: string;
  owner_id: string | null;
  name: string;
  domain: string | null;
  industry: string | null;
  employee_count: string | null;
  annual_revenue: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type ContactApi = {
  id: string;
  team_id: string;
  account_id: string | null;
  account_name: string | null;
  owner_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  lifecycle_stage: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type SalesTaskApi = {
  id: string;
  team_id: string;
  owner_id: string;
  contact_id: string | null;
  opportunity_id: string | null;
  title: string;
  task_type: string;
  priority: string;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};
export type SearchResultApi = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
  teamId?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (path.startsWith("/auth/")) headers.set("X-SalesSync-Request", "1");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const activeAccessToken = currentAccessToken ?? accessToken;
  if (activeAccessToken) headers.set("Authorization", `Bearer ${activeAccessToken}`);
  if (teamId) headers.set("X-Team-Id", teamId);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error(
      `Could not reach the API at ${API_URL}. Make sure FastAPI is running and CORS allows this frontend origin.`,
    );
  }

  const canRefresh =
    response.status === 401 &&
    !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/register") &&
    !path.startsWith("/auth/refresh") &&
    !path.startsWith("/auth/otp") &&
    !path.startsWith("/auth/password");

  if (canRefresh) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      headers.set("Authorization", `Bearer ${refreshedToken}`);
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
    } else {
      setAccessToken(null);
    }
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      detail?: string;
      error?: string;
    } | null;
    throw new Error(data?.error ?? data?.detail ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type ApiUserTeam = {
  id: string;
  name: string;
  invite_code?: string | null;
  created_at: string;
  role: "admin" | "manager" | "rep";
};

export const api = {
  getAdminOverview(accessToken: string, teamId: string) {
    return request<{ data: AdminOverview }>("/admin/overview", {}, accessToken, teamId);
  },
  securityActivity(accessToken: string, cursor?: string) {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return request<{ data: { events: SecurityEventApi[]; next_cursor: string | null } }>(
      `/auth/activity${query}`,
      {},
      accessToken,
    );
  },
  socialSignIn(provider: "google" | "github", link = false) {
    return request<{ data: { url: string } }>(
      `/auth/oauth/${provider}/${link ? "link" : "start"}`,
      { method: "POST" },
    );
  },
  requestPasswordReset(email: string) {
    return request<{ message: string }>("/auth/password/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  resetPassword(token: string, password: string) {
    return request<{ message: string }>("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },
  register(payload: { full_name: string; email: string; password: string }) {
    return request<{ data: AuthResponse & { needs_verification?: boolean } }>("/auth/register", {
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
  refreshSession() {
    return request<{ data: AuthResponse }>("/auth/refresh", { method: "POST" });
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
  inviteMember(email: string, accessToken: string, teamId?: string | null) {
    return request<{ data: ApiTeam }>(
      "/teams/invite",
      { method: "POST", body: JSON.stringify({ email }) },
      accessToken,
      teamId,
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
      teamId,
    );
  },
  removeMember(teamId: string, userId: string, accessToken: string) {
    return request<{ data: unknown }>(
      `/teams/${teamId}/members/${userId}`,
      { method: "DELETE" },
      accessToken,
      teamId,
    );
  },
  getInviteCode(teamId: string, accessToken: string) {
    return request<{ data: { invite_code: string } }>(
      `/teams/${teamId}/invite-code`,
      {},
      accessToken,
      teamId,
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
    teamId?: string | null,
  ) {
    return request<{ data: { icp: string; completed: boolean } }>(
      "/onboarding/icp",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  getOnboardingStatus(accessToken: string, teamId?: string | null) {
    return request<{ data: { icp: string; completed: boolean } }>(
      "/onboarding/status",
      {},
      accessToken,
      teamId,
    );
  },

  // === Opportunities ===
  getOpportunities(accessToken: string, teamId?: string | null) {
    return request<{ data: OpportunityApi[] }>("/opportunities/", {}, accessToken, teamId);
  },
  getOpportunitySummary(accessToken: string, teamId?: string | null) {
    return request<{ data: OpportunitySummaryApi }>(
      "/opportunities/summary",
      {},
      accessToken,
      teamId,
    );
  },
  createOpportunity(payload: OpportunityPayload, accessToken: string, teamId?: string | null) {
    return request<{ data: OpportunityApi }>(
      "/opportunities/",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  updateOpportunity(
    opportunityId: string,
    payload: Partial<OpportunityPayload>,
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: OpportunityApi }>(
      `/opportunities/${opportunityId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  deleteOpportunity(opportunityId: string, accessToken: string, teamId?: string | null) {
    return request<{ data: Record<string, never> }>(
      `/opportunities/${opportunityId}`,
      { method: "DELETE" },
      accessToken,
      teamId,
    );
  },

  // === CRM ===
  getAccounts(accessToken: string, teamId?: string | null) {
    return request<{ data: AccountApi[] }>("/crm/accounts", {}, accessToken, teamId);
  },
  createAccount(
    payload: Partial<AccountApi> & { name: string },
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: AccountApi }>(
      "/crm/accounts",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  getContacts(accessToken: string, teamId?: string | null) {
    return request<{ data: ContactApi[] }>("/crm/contacts", {}, accessToken, teamId);
  },
  createContact(
    payload: Partial<ContactApi> & { first_name: string },
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: ContactApi }>(
      "/crm/contacts",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  getSalesTasks(scope: "mine" | "team", accessToken: string, teamId?: string | null) {
    return request<{ data: SalesTaskApi[] }>(`/crm/tasks?scope=${scope}`, {}, accessToken, teamId);
  },
  createSalesTask(
    payload: Partial<SalesTaskApi> & { title: string },
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: SalesTaskApi }>(
      "/crm/tasks",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  updateSalesTask(
    id: string,
    payload: Partial<SalesTaskApi>,
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: SalesTaskApi }>(
      `/crm/tasks/${id}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  searchWorkspace(query: string, accessToken: string, teamId?: string | null) {
    return request<{ data: SearchResultApi[] }>(
      `/crm/search?q=${encodeURIComponent(query)}`,
      {},
      accessToken,
      teamId,
    );
  },

  // === Leads ===
  getLeads(status: string | undefined, accessToken: string | null, teamId?: string | null) {
    const query = status ? `?status=${status}` : "";
    return request<{ data: LeadApi[] }>(`/leads/${query}`, {}, accessToken, teamId);
  },
  getLead(leadId: string, accessToken: string, teamId?: string | null) {
    return request<{ data: LeadApi }>(`/leads/${leadId}`, {}, accessToken, teamId);
  },
  generateLeads(limit: number, accessToken: string, teamId?: string | null) {
    return request<{ data: { created: number; skipped_duplicates: number; leads: LeadApi[] } }>(
      "/leads/generate",
      { method: "POST", body: JSON.stringify({ limit }) },
      accessToken,
      teamId,
    );
  },
  importLeads(file: File, accessToken: string, teamId?: string | null) {
    const body = new FormData();
    body.append("file", file);
    return request<{
      data: { created: number; skipped_duplicates: number; invalid_rows: number; leads: LeadApi[] };
    }>("/leads/import", { method: "POST", body }, accessToken, teamId);
  },
  getLeadProvider(accessToken: string, teamId?: string | null) {
    return request<{ data: LeadProviderStatus }>("/leads/provider", {}, accessToken, teamId);
  },
  configureLeadProvider(
    apiKey: string,
    monthlyLimit: number,
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: LeadProviderStatus }>(
      "/leads/provider",
      { method: "PUT", body: JSON.stringify({ api_key: apiKey, monthly_limit: monthlyLimit }) },
      accessToken,
      teamId,
    );
  },
  disconnectLeadProvider(accessToken: string, teamId?: string | null) {
    return request<{ data: Record<string, never> }>(
      "/leads/provider",
      { method: "DELETE" },
      accessToken,
      teamId,
    );
  },
  createLead(
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
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: LeadApi }>(
      "/leads/",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  qualifyLead(leadId: string, accessToken: string, teamId?: string | null) {
    return request<{ data: LeadApi }>(
      `/leads/${leadId}/qualify`,
      { method: "POST" },
      accessToken,
      teamId,
    );
  },
  discardLead(leadId: string, accessToken: string, teamId?: string | null) {
    return request<{ data: LeadApi }>(
      `/leads/${leadId}/discard`,
      { method: "POST" },
      accessToken,
      teamId,
    );
  },
  deleteLead(leadId: string, accessToken: string, teamId?: string | null) {
    return request<{ data: Record<string, never> }>(
      `/leads/${leadId}`,
      { method: "DELETE" },
      accessToken,
      teamId,
    );
  },

  // === Emails ===
  sendEmail(
    payload: { lead_id: string; subject: string; body: string; tone?: string },
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: EmailApi }>(
      "/emails/",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  draftEmail(
    payload: { lead_id: string; subject: string; body: string },
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: EmailApi }>(
      "/emails/draft",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  getEmails(leadId: string, accessToken: string, teamId?: string | null) {
    return request<{ data: EmailApi[] }>(`/emails/?lead_id=${leadId}`, {}, accessToken, teamId);
  },
  deleteEmail(emailId: string, accessToken: string, teamId?: string | null) {
    return request<{ data: Record<string, never> }>(
      `/emails/${emailId}`,
      { method: "DELETE" },
      accessToken,
      teamId,
    );
  },

  // === Meetings ===
  getMeetings(accessToken: string, teamId?: string | null) {
    return request<{ data: MeetingApi[] }>("/meetings/", {}, accessToken, teamId);
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
    teamId?: string | null,
  ) {
    return request<{ data: MeetingApi }>(
      "/meetings/",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
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
    teamId?: string | null,
  ) {
    return request<{ data: MeetingApi }>(
      `/meetings/${meetingId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },

  // === Proposals ===
  getProposals(accessToken: string, teamId?: string | null) {
    return request<{ data: ProposalApi[] }>("/proposals/", {}, accessToken, teamId);
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
    teamId?: string | null,
  ) {
    return request<{ data: ProposalApi }>(
      "/proposals/",
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
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
    teamId?: string | null,
  ) {
    return request<{ data: ProposalApi }>(
      `/proposals/${proposalId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      accessToken,
      teamId,
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
    teamId?: string | null,
  ) {
    return request<{ data: unknown }>(
      `/proposals/${proposalId}/revisions`,
      { method: "POST", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  getProposalTemplate(accessToken: string, teamId?: string | null) {
    return request<{ data: ProposalTemplateApi }>("/proposals/template", {}, accessToken, teamId);
  },
  uploadProposalTemplate(
    payload: { file: File; template_name: string },
    accessToken: string,
    teamId?: string | null,
  ) {
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("template_name", payload.template_name);
    return request<{ data: ProposalTemplateApi }>(
      "/proposals/template/upload",
      { method: "POST", body: formData },
      accessToken,
      teamId,
    );
  },
  deleteProposalTemplate(accessToken: string, teamId?: string | null) {
    return request<{ data: Record<string, never> }>(
      "/proposals/template",
      { method: "DELETE" },
      accessToken,
      teamId,
    );
  },

  // === Knowledge Base ===
  getKnowledgeAssets(accessToken: string, teamId?: string | null) {
    return request<{ data: KnowledgeAssetApi[] }>("/knowledge-base/", {}, accessToken, teamId);
  },
  uploadKnowledgeAsset(
    payload: { file: File; title: string; description?: string; tags?: string },
    accessToken: string,
    teamId?: string | null,
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
      teamId,
    );
  },
  updateKnowledgeAsset(
    assetId: string,
    payload: { title?: string; description?: string; tags?: string[] },
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: KnowledgeAssetApi }>(
      `/knowledge-base/${assetId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      accessToken,
      teamId,
    );
  },
  deleteKnowledgeAsset(assetId: string, accessToken: string, teamId?: string | null) {
    return request<{ data: unknown }>(
      `/knowledge-base/${assetId}`,
      { method: "DELETE" },
      accessToken,
      teamId,
    );
  },

  // === Billing ===
  async getBillingStatus(accessToken: string, teamId?: string | null) {
    const response = await request<BillingStatus | { data: BillingStatus }>(
      "/billing/status",
      {},
      accessToken,
      teamId,
    );
    return { data: "data" in response ? response.data : response };
  },
  updateProposalStatus(
    proposalId: string,
    status: string,
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: ProposalApi }>(
      `/proposals/${proposalId}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      accessToken,
      teamId,
    );
  },
  updateProposalOutcome(
    proposalId: string,
    outcome: string,
    accessToken: string,
    teamId?: string | null,
  ) {
    return request<{ data: ProposalApi }>(
      `/proposals/${proposalId}/outcome`,
      { method: "PATCH", body: JSON.stringify({ outcome }) },
      accessToken,
      teamId,
    );
  },
  async createCheckoutSession(
    tier: "growth" | "enterprise",
    accessToken: string,
    teamId?: string | null,
  ) {
    const response = await request<{ checkout_url: string } | { data: { checkout_url: string } }>(
      `/billing/checkout/${tier}`,
      { method: "POST" },
      accessToken,
      teamId,
    );
    return { data: "data" in response ? response.data : response };
  },
  async cancelSubscription(accessToken: string, teamId?: string | null) {
    const response = await request<{ message: string } | { data: { message: string } }>(
      "/billing/cancel",
      { method: "POST" },
      accessToken,
      teamId,
    );
    return { data: "data" in response ? response.data : response };
  },
  async completeCheckout(sessionId: string, accessToken: string, teamId?: string | null) {
    const response = await request<BillingStatus | { data: BillingStatus }>(
      "/billing/checkout/complete",
      { method: "POST", body: JSON.stringify({ session_id: sessionId }) },
      accessToken,
      teamId,
    );
    return { data: "data" in response ? response.data : response };
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
  getCalcomStatus(accessToken: string, teamId: string) {
    return request<{ data: { connected: boolean; event_type_id?: string | null } }>(
      "/integrations/calcom/status",
      {},
      accessToken,
      teamId,
    );
  },
  startCalcomOAuth(accessToken: string, teamId: string) {
    return request<{ data: { url: string } }>(
      "/integrations/calcom/oauth/start",
      { method: "POST" },
      accessToken,
      teamId,
    );
  },
  configureCalcomEventType(eventTypeId: string, accessToken: string, teamId: string) {
    return request<{
      data: { connected: boolean; event_type_id: string; needs_event_type: boolean };
    }>(
      "/integrations/calcom/event-type",
      { method: "PUT", body: JSON.stringify({ event_type_id: eventTypeId }) },
      accessToken,
      teamId,
    );
  },
  configureCalcom(apiKey: string, eventTypeId: string, accessToken: string, teamId: string) {
    return request<{ data: { id: string; event_type_id: string } }>(
      "/integrations/calcom",
      {
        method: "PUT",
        body: JSON.stringify({ cal_api_key: apiKey, cal_event_type_id: eventTypeId }),
      },
      accessToken,
      teamId,
    );
  },
  disconnectCalcom(accessToken: string, teamId: string) {
    return request<{ data: Record<string, never> }>(
      "/integrations/calcom",
      { method: "DELETE" },
      accessToken,
      teamId,
    );
  },
  sendChat(message: string, accessToken: string, teamId?: string | null, chatId?: string | null) {
    return request<{ data: { reply: string } }>(
      `/chat/chats/${chatId}/messages`,
      { method: "POST", body: JSON.stringify({ message }) },
      accessToken,
      teamId,
    );
  },
  getChatMessages(accessToken: string, teamId?: string | null, chatId?: string | null) {
    return request<{ data: ChatMessageApi[] }>(
      `/chat/chats/${chatId}/messages`,
      {},
      accessToken,
      teamId,
    );
  },

  // === Multi-Chat ===
  listChats(accessToken: string, teamId?: string | null) {
    return request<{ data: ChatApi[] }>("/chat/chats", {}, accessToken, teamId);
  },
  createChat(chatName: string, accessToken: string, teamId?: string | null) {
    return request<{ data: ChatApi }>(
      "/chat/chats",
      { method: "POST", body: JSON.stringify({ chat_name: chatName }) },
      accessToken,
      teamId,
    );
  },
  renameChat(chatId: string, chatName: string, accessToken: string, teamId?: string | null) {
    return request<{ data: ChatApi }>(
      `/chat/chats/${chatId}`,
      { method: "PATCH", body: JSON.stringify({ chat_name: chatName }) },
      accessToken,
      teamId,
    );
  },
  deleteChat(chatId: string, accessToken: string, teamId?: string | null) {
    return request<{ data: unknown }>(
      `/chat/chats/${chatId}`,
      { method: "DELETE" },
      accessToken,
      teamId,
    );
  },

  // === OTP Verification ===
  requestOtp(email: string) {
    return request<{ data: Record<string, never> }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  verifyOtp(email: string, otp: string) {
    return request<{ data: Record<string, never> }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },
};

export type LeadApi = {
  id: string;
  name: string;
  email?: string;
  company?: string;
  title?: string;
  source?: string;
  score?: number | null;
  status: string;
  reasoning?: string;
  created_at: string;
};

export type ChatApi = {
  id: string;
  team_id: string;
  chat_name: string;
  created_at: string;
};

export type ChatMessageApi = {
  id: string;
  chat_id: string;
  sent_by: "user" | "ai";
  user_name: string;
  content: string;
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
  lead_id?: string;
  client?: string;
  company?: string;
  date: string;
  time: string;
  duration?: string;
  agenda: string[] | string | null;
  transcript?: string[];
  status: string;
  notes?: string;
  created_at: string;
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

export type BillingStatus = {
  tier: string;
  status: string;
  ends_at: string | null;
  cancel_at_period_end: boolean;
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

export type LeadProviderStatus = {
  provider: "apollo";
  connected: boolean;
  monthly_limit: number;
  used_this_month: number;
};

export type AdminOverview = {
  workspace: { id: string; name: string; created_at: string; icp_configured: boolean };
  members: { total: number; by_role: Record<string, number> };
  pipeline: {
    total_leads: number;
    by_status: Record<string, number>;
    average_score: number;
    qualification_rate: number;
  };
  outreach: { drafts: number; sent: number };
  meetings: { total: number; by_status: Record<string, number> };
  proposals: { total: number; by_outcome: Record<string, number>; win_rate: number };
  knowledge_base: { total: number; by_status: Record<string, number> };
  integrations: {
    gmail_connected: boolean;
    calcom_connected: boolean;
    apollo_connected: boolean;
    apollo_used: number;
    apollo_limit: number;
  };
  billing: { tier: string; status: string; renews_or_ends_at: string | null };
  recent_activity: Array<{
    type: "lead" | "meeting" | "proposal";
    label: string;
    detail: string;
    timestamp: string;
  }>;
};
