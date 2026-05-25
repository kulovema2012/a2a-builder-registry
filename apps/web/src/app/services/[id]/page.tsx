"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  api, type Service, type Endpoint, type Skill,
  type AgentCardSnapshot, type ValidationRun,
} from "@/lib/api";
import { Card, Button, StatusBadge } from "@/components/shared/ui";

export default function ServiceDetailPage() {
  const params = useParams();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [snapshot, setSnapshot] = useState<AgentCardSnapshot | null>(null);
  const [validations, setValidations] = useState<ValidationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "card" | "validation" | "skills">("overview");

  useEffect(() => {
    if (!serviceId) return;
    Promise.all([
      api.getService(serviceId),
      api.listEndpoints(serviceId),
      api.listSkills(serviceId),
      api.getAgentCard(serviceId).catch(() => null),
      api.listValidationRuns(serviceId).catch(() => []),
    ]).then(([svc, eps, sk, snap, vals]) => {
      setService(svc);
      setEndpoints(eps);
      setSkills(sk);
      setSnapshot(snap);
      setValidations(vals);
      setLoading(false);
    });
  }, [serviceId]);

  const handleValidate = async () => {
    setValidating(true);
    try {
      const run = await api.validateService(serviceId);
      setValidations([run, ...validations]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-[var(--text-muted)]">Loading service...</div>;
  }

  if (!service) {
    return <div className="text-center py-20 text-[var(--text-muted)]">Service not found</div>;
  }

  const latestValidation = validations[0];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "card", label: "Agent Card" },
    { id: "validation", label: "Validation" },
    { id: "skills", label: "Skills" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{service.name}</h1>
            <StatusBadge status={service.visibility} />
            <StatusBadge status={service.status} />
          </div>
          <p className="text-[var(--text-secondary)] mt-1">{service.description}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-[var(--text-muted)]">
            {service.provider_name && <span>by {service.provider_name}</span>}
            <span>v{service.version}</span>
            <span>Created {new Date(service.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleValidate} disabled={validating}>
            {validating ? "Validating..." : "Run Validation"}
          </Button>
          <Link href={`/console?service=${serviceId}`}>
            <Button variant="secondary">Test Console</Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold mb-4">Service Details</h3>
            <dl className="space-y-3">
              {[
                ["Slug", service.slug],
                ["Provider", service.provider_name],
                ["Version", service.version],
                ["Documentation", service.documentation_url],
                ["Tags", service.tags?.join(", ") || "None"],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
                  <dd className="text-sm font-medium">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold mb-3">Endpoints ({endpoints.length})</h3>
              {endpoints.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No endpoints configured</p>
              ) : endpoints.map((ep) => (
                <div key={ep.id} className="py-2 border-b border-[var(--border)] last:border-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-[var(--bg-hover)] px-2 py-0.5 rounded">{ep.protocol_binding}</code>
                    <span className="text-sm font-mono truncate">{ep.base_url}</span>
                    {ep.is_preferred && <span className="text-xs text-[var(--accent)]">Preferred</span>}
                  </div>
                </div>
              ))}
            </Card>

            {latestValidation && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Latest Validation</h3>
                  <StatusBadge status={latestValidation.status} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold">{latestValidation.score}%</div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {latestValidation.errors.length} errors, {latestValidation.warnings.length} warnings
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {latestValidation.response_time_ms}ms &middot; {new Date(latestValidation.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "card" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Agent Card JSON</h3>
            {snapshot && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>Checksum: {snapshot.checksum?.slice(0, 12)}...</span>
                <span>Fetched: {new Date(snapshot.fetched_at).toLocaleString()}</span>
              </div>
            )}
          </div>
          {snapshot ? (
            <pre className="bg-[var(--bg-primary)] rounded-lg p-4 text-sm overflow-auto max-h-[600px] font-mono text-[var(--text-secondary)]">
              {JSON.stringify(snapshot.raw_json, null, 2)}
            </pre>
          ) : (
            <p className="text-[var(--text-muted)]">No Agent Card snapshot available. Import or generate one.</p>
          )}
        </Card>
      )}

      {activeTab === "validation" && (
        <div className="space-y-4">
          {validations.length === 0 ? (
            <Card>
              <p className="text-center py-8 text-[var(--text-muted)]">
                No validation runs yet. Click &quot;Run Validation&quot; to start.
              </p>
            </Card>
          ) : validations.map((run) => (
            <Card key={run.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <StatusBadge status={run.status} />
                  <span className="text-lg font-bold">{run.score}%</span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {new Date(run.created_at).toLocaleString()}
                  </span>
                </div>
                <span className="text-sm text-[var(--text-muted)]">{run.response_time_ms}ms</span>
              </div>

              {/* Checks */}
              <div className="space-y-2">
                {run.checks.map((check, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                    check.status === "failed" ? "bg-red-500/5" :
                    check.status === "warning" ? "bg-amber-500/5" : "bg-green-500/5"
                  }`}>
                    <span className={`text-sm ${
                      check.status === "passed" ? "text-green-400" :
                      check.status === "failed" ? "text-red-400" : "text-amber-400"
                    }`}>
                      {check.status === "passed" ? "✓" : check.status === "failed" ? "✗" : "⚠"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm">{check.message}</p>
                      {check.field && <p className="text-xs text-[var(--text-muted)] mt-0.5">Field: {check.field}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "skills" && (
        <div className="space-y-4">
          {skills.length === 0 ? (
            <Card>
              <p className="text-center py-8 text-[var(--text-muted)]">No skills defined for this service.</p>
            </Card>
          ) : skills.map((skill) => (
            <Card key={skill.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{skill.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{skill.description}</p>
                  <div className="flex gap-2 mt-2">
                    {skill.tags?.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--text-muted)]">
                  {skill.input_modes?.length > 0 && <div>Input: {skill.input_modes.join(", ")}</div>}
                  {skill.output_modes?.length > 0 && <div>Output: {skill.output_modes.join(", ")}</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
