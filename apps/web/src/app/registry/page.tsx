"use client";

import { useState, useEffect } from "react";
import { api, type RegistryAgent } from "@/lib/api";
import { Card, Input, StatusBadge } from "@/components/shared/ui";

export default function RegistryPage() {
  const [agents, setAgents] = useState<RegistryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RegistryAgent | null>(null);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.q = search;
    api.discoverAgents(params)
      .then(setAgents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent Registry</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Discover A2A-compatible agent services. This endpoint is machine-readable for client-agent consumption.
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search agents by name, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <code className="flex items-center px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
          GET /api/v1/registry/agents
        </code>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="md:col-span-2 space-y-3">
          {loading ? (
            <Card><p className="text-center py-8 text-[var(--text-muted)]">Loading registry...</p></Card>
          ) : agents.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-[var(--text-muted)]">No agents published yet</p>
                <p className="text-sm text-[var(--text-muted)] mt-2">Create and publish a service to see it here.</p>
              </div>
            </Card>
          ) : (
            agents.map((agent) => (
              <Card
                key={agent.service_id}
                onClick={() => setSelected(agent)}
                className="cursor-pointer hover:border-[var(--accent)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {agent.agent_card?.name || agent.slug}
                      </h3>
                      <StatusBadge status={agent.validation_status || "unknown"} />
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {(agent.agent_card?.description as string) || "No description"}
                    </p>
                    {agent.agent_card?.skills && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {(agent.agent_card.skills as any[]).slice(0, 4).map((skill: any) => (
                          <span key={skill.id || skill.name} className="text-xs px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                            {skill.name}
                          </span>
                        ))}
                        {(agent.agent_card.skills as any[]).length > 4 && (
                          <span className="text-xs text-[var(--text-muted)]">
                            +{(agent.agent_card.skills as any[]).length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-[var(--text-muted)] shrink-0">
                    <div>{agent.visibility}</div>
                    {agent.last_validated_at && (
                      <div>Validated: {new Date(agent.last_validated_at).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {selected ? (
            <Card className="sticky top-8">
              <h3 className="font-semibold mb-3">
                {selected.agent_card?.name || selected.slug}
              </h3>
              {selected.agent_card && (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-[var(--text-muted)]">URL</span>
                    <p className="font-mono text-xs mt-0.5 break-all">{selected.agent_card.url as string || "—"}</p>
                  </div>
                  {selected.agent_card.version && (
                    <div>
                      <span className="text-[var(--text-muted)]">Version</span>
                      <p>{selected.agent_card.version as string}</p>
                    </div>
                  )}
                  {selected.agent_card.provider && (
                    <div>
                      <span className="text-[var(--text-muted)]">Provider</span>
                      <p>{(selected.agent_card.provider as any).organization || "—"}</p>
                    </div>
                  )}
                  {selected.agent_card.capabilities && (
                    <div>
                      <span className="text-[var(--text-muted)]">Capabilities</span>
                      <div className="flex gap-2 mt-1">
                        {Object.entries(selected.agent_card.capabilities as Record<string, boolean>)
                          .filter(([, v]) => v)
                          .map(([k]) => (
                            <span key={k} className="text-xs px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                              {k}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  {selected.agent_card.defaultInputModes && (
                    <div>
                      <span className="text-[var(--text-muted)]">Input Modes</span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(selected.agent_card.defaultInputModes as string[]).map((m) => (
                          <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-hover)]">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-[var(--text-muted)] text-center py-8">Select an agent to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
