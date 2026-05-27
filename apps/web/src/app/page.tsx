"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/shared/icon";
import { api, type RegistryAgent } from "@/lib/api";

interface CardData {
  skills: { id: string; name: string }[];
  capabilities: { streaming?: boolean; pushNotifications?: boolean };
  interfaces: { protocolBinding: string }[];
}

function extractCard(agentCard: unknown): CardData {
  if (!agentCard || typeof agentCard !== "object") return { skills: [], capabilities: {}, interfaces: [] };
  const c = agentCard as Record<string, unknown>;
  return {
    skills: Array.isArray(c.skills)
      ? (c.skills as Array<Record<string, unknown>>).map((s, i) => ({
          id: String(s.id ?? i),
          name: String(s.name ?? "skill"),
        }))
      : [],
    capabilities: (c.capabilities ?? {}) as CardData["capabilities"],
    interfaces: Array.isArray(c.additionalInterfaces)
      ? (c.additionalInterfaces as Array<Record<string, unknown>>).map((i) => ({
          protocolBinding: String(i.protocolBinding ?? "JSONRPC"),
        }))
      : [{ protocolBinding: "JSONRPC" }],
  };
}

function ValidationDot({ status, size = 6 }: { status?: string; size?: number }) {
  const color =
    status === "passed" ? "var(--ok)" :
    status === "warning" ? "var(--warn)" :
    status === "failed" ? "var(--err)" :
    "var(--text-3)";
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      borderRadius: "50%", background: color, flexShrink: 0,
    }} />
  );
}

function VisibilityBadge({ v }: { v: string }) {
  if (v === "public") return <span className="badge badge-sm"><Icon name="globe" size={10} /> public</span>;
  if (v === "internal") return <span className="badge badge-sm"><Icon name="building" size={10} /> internal</span>;
  return <span className="badge badge-sm"><Icon name="lock" size={10} /> private</span>;
}

function ProtocolBadge({ p }: { p: string }) {
  return <span className="badge badge-sm">{p}</span>;
}

function AgentMark({ name, size = 36 }: { name: string; size?: number }) {
  const hashes = ["#C7F84A", "#B8A4FF", "#7CC4FF", "#FFB58E", "#F87171", "#4ADE80", "#F5B544", "#FF9DCE"];
  const i = (name.charCodeAt(0) + name.charCodeAt(name.length > 1 ? 1 : 0)) % hashes.length;
  const c = hashes[i];
  return (
    <div className="agent-mark" style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${c}33, ${c}11)`,
      border: `1px solid ${c}33`,
      color: c,
      fontSize: size * 0.5,
    }}>
      {name[0]}
    </div>
  );
}

function AgentCard({ agent }: { agent: RegistryAgent }) {
  const router = useRouter();
  const card = extractCard(agent.agentCard);
  return (
    <div className="agent-card" role="button" tabIndex={0}
      onClick={() => router.push(`/registry/${agent.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/registry/${agent.id}`); }}>
      <div className="agent-card-head">
        <AgentMark name={agent.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="agent-card-title">
            <span>{agent.name}</span>
          </div>
          <div className="agent-card-provider">
            <span className="mono">{agent.provider.organization ?? "Unknown"}</span>
            {agent.version && <span className="muted"> · v{agent.version}</span>}
          </div>
        </div>
        <span className="btn-ghost btn btn-icon btn-sm" role="button" onClick={(e) => { e.stopPropagation(); }}>
          <Icon name="more" size={14} />
        </span>
      </div>
      <p className="agent-card-desc">{agent.description ?? "No description"}</p>
      <div className="agent-card-skills">
        {card.skills.slice(0, 3).map((s) => (
          <span key={s.id} className="skill"><span className="dot"></span>{s.name}</span>
        ))}
        {card.skills.length > 3 && <span className="skill muted">+{card.skills.length - 3}</span>}
      </div>
      <div className="agent-card-foot">
        <div className="agent-card-meta">
          <VisibilityBadge v="public" />
          {card.interfaces[0] && <ProtocolBadge p={card.interfaces[0].protocolBinding} />}
          {card.capabilities.streaming && <span className="badge badge-sm"><Icon name="zap" size={10} /> stream</span>}
        </div>
      </div>
    </div>
  );
}

function AgentRow({ agent }: { agent: RegistryAgent }) {
  const router = useRouter();
  const card = extractCard(agent.agentCard);
  return (
    <button className="agent-row" onClick={() => router.push(`/registry/${agent.id}`)}>
      <div className="agent-row-name">
        <AgentMark name={agent.name} size={28} />
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontWeight: 500 }}>{agent.name}</span>
            {agent.version && <span className="muted mono" style={{ fontSize: 11 }}>v{agent.version}</span>}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>{agent.provider.organization ?? "Unknown"}</div>
        </div>
      </div>
      <div className="agent-row-desc">{agent.description ?? "No description"}</div>
      <div className="agent-row-skills">
        {card.skills.slice(0, 2).map((s) => (
          <span key={s.id} className="skill"><span className="dot"></span>{s.name}</span>
        ))}
        {card.skills.length > 2 && <span className="muted" style={{ fontSize: 11 }}>+{card.skills.length - 2}</span>}
      </div>
      <div className="agent-row-meta">
        {card.interfaces[0] && <ProtocolBadge p={card.interfaces[0].protocolBinding} />}
        <VisibilityBadge v="public" />
      </div>
      <Icon name="chevronRight" size={14} className="muted" />
    </button>
  );
}

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="filter-group">
      <button className="filter-head" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <Icon name={open ? "chevronDown" : "chevronRight"} size={12} />
      </button>
      {open && <div className="filter-body">{children}</div>}
    </div>
  );
}

function CheckRow({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="check-row">
      <span className={"check" + (checked ? " on" : "")}>
        {checked && <Icon name="check" size={11} stroke={2.5} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span className="muted mono" style={{ fontSize: 11 }}>{count}</span>}
    </label>
  );
}

export default function RegistryPageWrapper() {
  return (
    <Suspense fallback={<div className="empty" style={{ padding: 60 }}><Icon name="activity" size={28} className="muted" /><h3>Loading…</h3></div>}>
      <RegistryPage />
    </Suspense>
  );
}

function RegistryPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [agents, setAgents] = useState<RegistryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list" | "table">("grid");
  const [filters, setFilters] = useState<Record<string, Set<string>>>(() => ({
    protocol: new Set<string>(),
    capability: new Set<string>(),
    category: new Set(categoryParam ? [categoryParam] : []),
  }));
  const [sort, setSort] = useState("relevance");

  const fetchAgents = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (query) params.q = query;
      const res = await api.discoverAgents(Object.keys(params).length ? params : undefined);
      setAgents(res.agents);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchAgents(q || undefined); }, 300);
    return () => clearTimeout(timer);
  }, [q, fetchAgents]);

  const toggle = (group: string, val: string) =>
    setFilters((f) => {
      const s = new Set(f[group]);
      if (s.has(val)) s.delete(val); else s.add(val);
      return { ...f, [group]: s };
    });

  const filtered = useMemo(() => {
    let list = agents.filter((a) => {
      const card = extractCard(a.agentCard);
      if (filters.protocol.size && !card.interfaces.some((i) => filters.protocol.has(i.protocolBinding))) return false;
      if (filters.category.size && !(a.tags ?? []).some((t) => filters.category.has(t))) return false;
      if (filters.capability.size) {
        for (const c of filters.capability) {
          if (c === "streaming" && !card.capabilities.streaming) return false;
          if (c === "pushNotifications" && !card.capabilities.pushNotifications) return false;
        }
      }
      return true;
    });
    if (sort === "recent") list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [agents, filters, sort]);

  const tagCounts = useMemo(() => {
    const c: Record<string, number> = {};
    agents.forEach((a) => (a.tags ?? []).forEach((t) => c[t] = (c[t] || 0) + 1));
    return c;
  }, [agents]);

  const activeFilterCount =
    filters.protocol.size + filters.category.size + filters.capability.size;

  return (
    <div className="registry">
      <div className="registry-head">
        <div className="registry-title">
          <h1>Registry</h1>
          <span className="tiny">{loading ? "Loading…" : `${filtered.length} of ${agents.length} services`}</span>
        </div>
        <div className="registry-actions">
          <Link href="/builder" className="btn btn-primary btn-sm">
            <Icon name="plus" size={14} />Register agent
          </Link>
        </div>
      </div>

      <div className="registry-toolbar">
        <div className="search">
          <Icon name="search" size={14} />
          <input className="search-input" placeholder="Search by name, skill, tag…"
            value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button className="btn-ghost btn btn-icon btn-sm" onClick={() => setQ("")}><Icon name="x" size={12} /></button>}
        </div>
        <div className="vr" style={{ height: 22 }}></div>
        <div className="seg">
          <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")} title="Grid"><Icon name="grid" size={14} /></button>
          <button className={view === "list" ? "on" : ""} onClick={() => setView("list")} title="List"><Icon name="list" size={14} /></button>
        </div>
        <div className="vr" style={{ height: 22 }}></div>
        <select className="select" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="relevance">Sort: Relevance</option>
          <option value="recent">Sort: Recently added</option>
        </select>
      </div>

      <div className="registry-body">
        <aside className="filters">
          <div style={{ display: "flex", alignItems: "center", padding: "4px 8px 10px" }}>
            <div className="tiny">Filters {activeFilterCount > 0 && <span className="badge badge-sm badge-signal">{activeFilterCount}</span>}</div>
            {activeFilterCount > 0 && (
              <button className="btn-ghost btn btn-sm" style={{ marginLeft: "auto" }}
                onClick={() => setFilters({ protocol: new Set(), category: new Set(), capability: new Set() })}>
                Clear
              </button>
            )}
          </div>

          <FilterGroup title="Protocol binding">
            {["JSONRPC", "GRPC", "HTTP+JSON"].map((p) => (
              <CheckRow key={p} label={p}
                checked={filters.protocol.has(p)} onChange={() => toggle("protocol", p)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Capability">
            {[["streaming", "streaming"], ["pushNotifications", "push notifications"]].map(([k, l]) => (
              <CheckRow key={k} label={l}
                checked={filters.capability.has(k)} onChange={() => toggle("capability", k)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Tags" defaultOpen={false}>
            {Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => (
              <CheckRow key={tag} label={tag} count={count}
                checked={filters.category.has(tag)} onChange={() => toggle("category", tag)} />
            ))}
          </FilterGroup>
        </aside>

        <main className="catalog">
          {loading ? (
            <div className="empty">
              <Icon name="activity" size={28} className="muted" />
              <h3>Loading agents…</h3>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <Icon name="search" size={28} className="muted" />
              <h3>No agents match</h3>
              <p className="muted">Try clearing filters or register a new agent.</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid">
              {filtered.map((a) => <AgentCard key={a.id} agent={a} />)}
            </div>
          ) : (
            <div className="list">
              <div className="list-head">
                <div>Agent</div>
                <div>Description</div>
                <div>Top skills</div>
                <div>Protocol · Visibility</div>
                <div></div>
              </div>
              {filtered.map((a) => <AgentRow key={a.id} agent={a} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
