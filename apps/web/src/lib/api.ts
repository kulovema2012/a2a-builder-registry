const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY = "access_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_URL}/api/v1${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...fetchOptions, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Types ---

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  provider_name: string | null;
  provider_url: string | null;
  visibility: string;
  status: string;
  owner_user_id: string | null;
  current_snapshot_id: string | null;
  tags: string[] | null;
  icon_url: string | null;
  documentation_url: string | null;
  version: string | null;
  delegates_to: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Endpoint {
  id: string;
  service_id: string;
  agent_card_url: string | null;
  base_url: string | null;
  protocol_binding: string | null;
  protocol_version: string | null;
  tenant: string | null;
  is_preferred: boolean | null;
  created_at: string;
}

export interface Skill {
  id: string;
  service_id: string;
  external_skill_id: string | null;
  name: string;
  description: string | null;
  tags: string[] | null;
  input_modes: string[] | null;
  output_modes: string[] | null;
  examples: unknown;
  security_requirements: unknown;
}

export interface AgentCardSnapshot {
  id: string;
  service_id: string;
  raw_json: unknown;
  normalized_json: unknown;
  schema_version: string | null;
  checksum: string | null;
  fetched_at: string;
  created_at: string;
}

export interface ValidationRun {
  id: string;
  service_id: string;
  status: string;
  score: number;
  checks: unknown[];
  errors: unknown[];
  warnings: unknown[];
  response_time_ms: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface RegistryAgent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  provider: { organization: string | null; url: string | null };
  tags: string[] | null;
  version: string | null;
  delegatesTo: string[] | null;
  agentCard: unknown;
  createdAt: string;
}

export interface RegistryEvent {
  id: string;
  serviceId: string | null;
  serviceName: string | null;
  serviceSlug: string | null;
  actorId: string | null;
  eventType: string;
  metadata: unknown;
  createdAt: string;
}

export interface TestConsoleResponse {
  task_id: string;
  status: string;
  messages: unknown[];
  raw_request: unknown;
  raw_response: unknown;
}

export interface McpConnection {
  id: string;
  service_id: string;
  name: string;
  transport: string;
  endpoint_url: string;
  verified: boolean;
  last_verified_at: string | null;
  created_at: string;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: string;
  org_id: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// --- API ---

export const auth = {
  register: (data: { name: string; email: string; password: string; org_name: string }) =>
    apiFetch<UserPublic>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(res.access_token);
    return res;
  },

  logout: () => {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
  },
};

export const api = {
  health: () =>
    fetch(`${API_URL}/health`)
      .then((r) => { if (!r.ok) throw new Error("health failed"); return r.json() as Promise<{ status: string; version: string; database: string }>; }),

  // Services
  createService: (data: Partial<Service>) =>
    apiFetch<Service>("/services", { method: "POST", body: JSON.stringify(data) }),

  listServices: (params?: Record<string, string>) =>
    apiFetch<{ services: Service[]; page: number }>("/services", { params }),

  getService: (id: string) =>
    apiFetch<Service>(`/services/${id}`),

  updateService: (id: string, data: Partial<Service>) =>
    apiFetch<Service>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteService: (id: string) =>
    apiFetch<{ message: string }>(`/services/${id}`, { method: "DELETE" }),

  // Endpoints
  listEndpoints: (serviceId: string) =>
    apiFetch<{ endpoints: Endpoint[] }>(`/services/${serviceId}/endpoints`),

  addEndpoint: (serviceId: string, data: Partial<Endpoint>) =>
    apiFetch<Endpoint>(`/services/${serviceId}/endpoints`, { method: "POST", body: JSON.stringify(data) }),

  // Skills
  listSkills: (serviceId: string) =>
    apiFetch<{ skills: Skill[] }>(`/services/${serviceId}/skills`),

  addSkill: (serviceId: string, data: Partial<Skill>) =>
    apiFetch<Skill>(`/services/${serviceId}/skills`, { method: "POST", body: JSON.stringify(data) }),

  // Agent Card
  importAgentCard: (agentCardUrl: string) =>
    apiFetch<Service>("/services/import", { method: "POST", body: JSON.stringify({ agent_card_url: agentCardUrl }) }),

  generateAgentCard: (serviceId: string) =>
    apiFetch<AgentCardSnapshot>(`/services/${serviceId}/agent-card/generate`, { method: "POST" }),

  getAgentCard: (serviceId: string) =>
    apiFetch<AgentCardSnapshot>(`/services/${serviceId}/agent-card`),

  // Validation
  validateService: (serviceId: string) =>
    apiFetch<ValidationRun>(`/services/${serviceId}/validate`, { method: "POST" }),

  listValidationRuns: (serviceId: string) =>
    apiFetch<{ runs: ValidationRun[] }>(`/services/${serviceId}/validation-runs`),

  // Registry
  discoverAgents: (params?: Record<string, string>) =>
    apiFetch<{ agents: RegistryAgent[]; page: number }>("/registry/agents", { params }),

  getAgent: (id: string) =>
    apiFetch<RegistryAgent>(`/registry/agents/${id}`),

  requestPublication: (serviceId: string) =>
    apiFetch<{ id: string; status: string }>(`/registry/services/${serviceId}/publish-request`, { method: "POST" }),

  // Events
  listEvents: (params?: Record<string, string>) =>
    apiFetch<{ events: RegistryEvent[]; page: number }>("/registry/events", { params }),

  // Test Console
  sendTestRequest: (data: { service_id: string; skill_id?: string; message: string }) =>
    apiFetch<TestConsoleResponse>("/test-console/send", { method: "POST", body: JSON.stringify(data) }),

  // Admin
  listPendingServices: (params?: Record<string, string>) =>
    apiFetch<{ services: unknown[]; page: number }>("/admin/services", { params }),

  approveService: (serviceId: string, action: string, notes?: string) =>
    apiFetch<{ service_id: string; action: string; status: string }>(
      `/admin/services/${serviceId}/approve`,
      { method: "POST", body: JSON.stringify({ action, notes }) },
    ),

  suspendService: (serviceId: string) =>
    apiFetch<{ service_id: string; status: string }>(`/admin/services/${serviceId}/suspend`, { method: "POST" }),

  // MCP
  listMcpConnections: (serviceId: string) =>
    apiFetch<{ connections: McpConnection[] }>(`/mcp/connections?service_id=${serviceId}`),

  createMcpConnection: (serviceId: string, data: { name: string; transport: string; endpoint_url: string }) =>
    apiFetch<McpConnection>("/mcp/connections", { method: "POST", body: JSON.stringify({ ...data, service_id: serviceId }) }),

  deleteMcpConnection: (connectionId: string) =>
    apiFetch<{ message: string }>(`/mcp/connections/${connectionId}`, { method: "DELETE" }),

  initializeMcp: (serviceId: string) =>
    apiFetch<unknown>(`/mcp/initialize`, { method: "POST", body: JSON.stringify({ service_id: serviceId }) }),
};

// ── AI streaming helper ─────────────────────────────────────────

export async function streamAI(
  path: string,
  body: unknown,
  onChunk: (text: string) => void,
  onDone: (full: string) => void,
): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || `AI error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") { onDone(full); return; }
      try {
        const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const chunk = parsed?.choices?.[0]?.delta?.content ?? "";
        if (chunk) { full += chunk; onChunk(chunk); }
      } catch { /* skip malformed SSE lines */ }
    }
  }
  onDone(full);
}
