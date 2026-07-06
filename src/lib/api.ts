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
  if (options.body) headers.set("Content-Type", "application/json");
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
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  logout(accessToken: string) {
    return request<void>("/auth/logout", { method: "POST" }, accessToken);
  },
  createTeam(name: string, accessToken: string) {
    return request<ApiTeam>(
      "/teams/",
      { method: "POST", body: JSON.stringify({ name }) },
      accessToken,
    );
  },
  joinTeam(inviteCode: string, accessToken: string) {
    return request<{ message: string }>(
      "/teams/join",
      { method: "POST", body: JSON.stringify({ invite_code: inviteCode }) },
      accessToken,
    );
  },
  getTeam(teamId: string, accessToken: string) {
    return request<ApiTeam>(`/teams/${teamId}`, {}, accessToken);
  },
  inviteMember(email: string, accessToken: string) {
    return request<{ message: string }>(
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
    return request<{ message: string }>(
      `/teams/${teamId}/members/${userId}/role`,
      { method: "PUT", body: JSON.stringify({ role }) },
      accessToken,
    );
  },
  removeMember(teamId: string, userId: string, accessToken: string) {
    return request<void>(`/teams/${teamId}/members/${userId}`, { method: "DELETE" }, accessToken);
  },
  getInviteCode(teamId: string, accessToken: string) {
    return request<{ invite_code: string }>(`/teams/${teamId}/invite-code`, {}, accessToken);
  },
  getMyTeams(accessToken: string) {
    return request<{ data: ApiUserTeam[] }>("/teams/", {}, accessToken);
  },
};
