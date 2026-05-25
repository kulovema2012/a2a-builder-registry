const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

  const res = await fetch(url, { ...fetchOptions, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Service types
export interface Service {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string;
  provider_name: string | null;
  provider_url: string | null;
  visibility: string;
  status: string;
  tags: string[];
  icon_url: string | null;
  documentation_url: string | null;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface Endpoint {
  id: string;
  service_id: string;
  agent_card_url: string;
  base_url: string;
  protocol_binding: string;
  protocol_version: string;
  tenant: string | null;
  is_preferred: boolean;
  created_at: string;
}

export interface Skill {
  id: string;
  service_id: string;
  external_skill_id: string | null;
  name: string;
  description: string;
  tags: string[];
  input_modes: string[];
  output_modes: string[];
  examples: Record<string, unknown>[];
  security_requirements: Record<string, unknown> | null;
}

export interface AgentCardSnapshot {
  id: string;
  service_id: string;
  raw_json: Record<string, unknown>;
  normalized_json: Record<string, unknown> | null;
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
  checks: ValidationCheck[];
  errors: ValidationCheck[];
  warnings: ValidationCheck[];
  response_time_ms: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface ValidationCheck {
  check: string;
  status: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedServices {
  items: Service[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RegistryAgent {
  service_id: string;
  slug: string;
  visibility: string;
  validation_status: string | null;
  last_validated_at: string | null;
  agent_card: Record<string, unknown> | null;
}

export interface TestResult {
  success: boolean;
  status_code: number | null;
  response_body: Record<string, unknown> | null;
  response_time_ms: number | null;
  error: string | null;
}

// API functions
export const api = {
  // Services
  createService: (data: Partial<Service>) =>
    apiFetch<Service>("/services", { method: "POST", body: JSON.stringify(data) }),

  listServices: (params?: Record<string, string>) =>
    apiFetch<PaginatedServices>("/services", { params }),

  getService: (id: string) =>
    apiFetch<Service>(`/services/${id}`),

  updateService: (id: string, data: Partial<Service>) =>
    apiFetch<Service>(`/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteService: (id: string) =>
    apiFetch<void>(`/services/${id}`, { method: "DELETE" }),

  // Endpoints
  listEndpoints: (serviceId: string) =>
    apiFetch<Endpoint[]>(`/services/${serviceId}/endpoints`),

  addEndpoint: (serviceId: string, data: Partial<Endpoint>) =>
    apiFetch<Endpoint>(`/services/${serviceId}/endpoints`, { method: "POST", body: JSON.stringify(data) }),

  // Skills
  listSkills: (serviceId: string) =>
    apiFetch<Skill[]>(`/services/${serviceId}/skills`),

  addSkill: (serviceId: string, data: Partial<Skill>) =>
    apiFetch<Skill>(`/services/${serviceId}/skills`, { method: "POST", body: JSON.stringify(data) }),

  // Agent Card
  importAgentCard: (agentCardUrl: string) =>
    apiFetch<Service>("/services/import", { method: "POST", body: JSON.stringify({ agent_card_url: agentCardUrl }) }),

  generateAgentCard: (serviceId: string, data: Record<string, unknown>) =>
    apiFetch<AgentCardSnapshot>(`/services/${serviceId}/agent-card/generate`, { method: "POST", body: JSON.stringify(data) }),

  getAgentCard: (serviceId: string) =>
    apiFetch<AgentCardSnapshot>(`/services/${serviceId}/agent-card`),

  // Validation
  validateService: (serviceId: string) =>
    apiFetch<ValidationRun>(`/services/${serviceId}/validate`, { method: "POST" }),

  listValidationRuns: (serviceId: string) =>
    apiFetch<ValidationRun[]>(`/services/${serviceId}/validation-runs`),

  // Registry
  discoverAgents: (params?: Record<string, string>) =>
    apiFetch<RegistryAgent[]>("/registry/agents", { params }),

  // Publication
  requestPublication: (serviceId: string) =>
    apiFetch<unknown>(`/registry/services/${serviceId}/publish-request`, { method: "POST" }),

  // Test Console
  sendTestRequest: (data: { service_id: string; endpoint_id?: string; method: string; payload: Record<string, unknown> }) =>
    apiFetch<TestResult>("/test-console/send", { method: "POST", body: JSON.stringify(data) }),

  // Admin
  approveService: (serviceId: string, approved: boolean, notes?: string) =>
    apiFetch<unknown>(`/admin/services/${serviceId}/approve`, { method: "POST", body: JSON.stringify({ approved, notes }) }),

  suspendService: (serviceId: string) =>
    apiFetch<Service>(`/admin/services/${serviceId}/suspend`, { method: "POST" }),
};
