"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/shared/icon";
import { api, type RegistryAgent } from "@/lib/api";
import { fmtAgo } from "@/lib/helpers";
import { HighlightedJSON } from "@/lib/json-view";

const hashes = ["#C7F84A", "#B8A4FF", "#7CC4FF", "#FFB58E", "#F87171", "#4ADE80", "#F5B544", "#FF9DCE"];
function AgentMark({ name, size = 48 }: { name: string; size?: number }) {
  const i = (name.charCodeAt(0) + name.charCodeAt(name.length > 1 ? 1 : 0)) % hashes.length;
  const c = hashes[i];
  return (
    <div className="agent-mark" style={{ width: size, height: size, background: `linear-gradient(135deg, ${c}33, ${c}11)`, border: `1px solid ${c}33`, color: c, fontSize: size * 0.45 }}>
      {name[0]}
    </div>
  );
}

type CardData = {
  skills: { id: string; name: string; description?: string; tags?: string[] }[];
  capabilities: Record<string, boolean>;
  interfaces: { protocolBinding?: string; url?: string }[];
};

function extractCard(agentCard: unknown): CardData {
  if (!agentCard || typeof agentCard !== "object") return { skills: [], capabilities: {}, interfaces: [] };
  const c = agentCard as Record<string, unknown>;
  return {
    skills: Array.isArray(c.skills)
      ? (c.skills as Array<Record<string, unknown>>).map((s, i) => ({
          id: String(s.id ?? i),
          name: String(s.name ?? "skill"),
          description: s.description ? String(s.description) : undefined,
          tags: Array.isArray(s.tags) ? s.tags.map(String) : undefined,
        }))
      : [],
    capabilities: (c.capabilities && typeof c.capabilities === "object") ? c.capabilities as Record<string, boolean> : {},
    interfaces: Array.isArray(c.additionalInterfaces)
      ? (c.additionalInterfaces as Array<Record<string, unknown>>).map((iface) => ({
          protocolBinding: iface.protocolBinding ? String(iface.protocolBinding) : "JSONRPC",
          url: iface.url ? String(iface.url) : undefined,
        }))
      : [],
  };
}

export default function RegistryAgentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<RegistryAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "card">("overview");

  useEffect(() => {
    api.getAgent(id)
      .then(setAgent)
      .catch((e) => setError(e.message ?? "Failed to load agent"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-body" style={{ padding: "60px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="empty"><Icon name="activity" size={28} className="muted" /><h3>Loading agent…</h3></div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="page-body" style={{ padding: "60px 0" }}>
        <div className="empty">
          <Icon name="alertCircle" size={28} className="muted" />
          <h3>Agent not found</h3>
          <p className="muted">{error}</p>
          <Link href="/" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>Back to Registry</Link>
        </div>
      </div>
    );
  }

  const card = extractCard(agent.agentCard);

  return (
    <div className="page-body">
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 13 }}>
        <button className="btn-ghost btn btn-sm" onClick={() => router.back()} style={{ padding: "2px 6px" }}>
          <Icon name="chevronLeft" size={13} /> Registry
        </button>
      </div>

      {/* Header */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <AgentMark name={agent.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{agent.name}</h1>
            {agent.version && <span className="badge badge-sm mono">v{agent.version}</span>}
            <span className="badge badge-sm"><Icon name="globe" size={10} /> public</span>
          </div>
          {agent.provider.organization && (
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              by {agent.provider.organization}
              {agent.provider.url && (
                <> · <a href={agent.provider.url} target="_blank" rel="noopener noreferrer" className="link">{agent.provider.url}</a></>
              )}
            </div>
          )}
          {agent.description && <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6 }}>{agent.description}</p>}
          {agent.tags && agent.tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {agent.tags.map((t) => <span key={t} className="badge badge-sm">{t}</span>)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Link href={`/console?agent=${agent.id}`} className="btn btn-primary btn-sm">
            <Icon name="play" size={13} /> Test in Console
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {(["overview", "card"] as const).map((t) => (
          <button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>
            {t === "overview" ? "Overview" : "Agent Card"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
          {/* Skills */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              Skills {card.skills.length > 0 && <span className="muted mono" style={{ fontSize: 12 }}>({card.skills.length})</span>}
            </h3>
            {card.skills.length === 0 ? (
              <div className="empty" style={{ padding: "32px 0" }}>
                <Icon name="zap" size={20} className="muted" />
                <p className="muted" style={{ fontSize: 13 }}>No skill definitions in agent card.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {card.skills.map((s) => (
                  <div key={s.id} className="card" style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="dot" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{s.name}</span>
                      <span className="muted mono" style={{ fontSize: 11 }}>{s.id}</span>
                    </div>
                    {s.description && <p className="muted" style={{ margin: "6px 0 0 16px", fontSize: 13 }}>{s.description}</p>}
                    {s.tags && s.tags.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8, marginLeft: 16 }}>
                        {s.tags.map((t) => <span key={t} className="badge badge-sm">{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="card" style={{ padding: "14px 16px" }}>
              <div className="tiny" style={{ marginBottom: 10 }}>Details</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="muted">Added</span>
                  <span>{fmtAgo(agent.createdAt)}</span>
                </div>
                {card.interfaces.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="muted">Protocol</span>
                    <span className="badge badge-sm">{card.interfaces[0].protocolBinding ?? "JSONRPC"}</span>
                  </div>
                )}
                {Object.entries(card.capabilities).filter(([, v]) => v).map(([k]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="muted">{k}</span>
                    <span className="badge badge-sm badge-ok">yes</span>
                  </div>
                ))}
              </div>
            </div>

            {agent.delegatesTo && agent.delegatesTo.length > 0 && (
              <div className="card" style={{ padding: "14px 16px" }}>
                <div className="tiny" style={{ marginBottom: 10 }}>Delegates to</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  {agent.delegatesTo.map((d) => <span key={d} className="muted mono">{d}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "card" && (
        <div>
          {agent.agentCard ? (
            <HighlightedJSON data={agent.agentCard} />
          ) : (
            <div className="empty" style={{ padding: "40px 0" }}>
              <Icon name="fileText" size={24} className="muted" />
              <p className="muted">No agent card snapshot available for this agent.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
