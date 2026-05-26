"use client";

import { useState, useEffect, useId, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/shared/icon";
import {
  api,
  type Service,
  type Endpoint,
  type Skill,
  type AgentCardSnapshot,
  type ValidationRun,
} from "@/lib/api";
import { fmtAgo } from "@/lib/helpers";
import { HighlightedJSON } from "@/lib/json-view";

const hashes = ["#C7F84A", "#B8A4FF", "#7CC4FF", "#FFB58E", "#F87171", "#4ADE80", "#F5B544", "#FF9DCE"];
function AgentMark({ name, size = 36 }: { name: string; size?: number }) {
  const i = (name.charCodeAt(0) + name.charCodeAt(name.length > 1 ? 1 : 0)) % hashes.length;
  const c = hashes[i];
  return <div className="agent-mark" style={{ width: size, height: size, background: `linear-gradient(135deg, ${c}33, ${c}11)`, border: `1px solid ${c}33`, color: c, fontSize: size * 0.5 }}>{name[0]}</div>;
}

function ValidationDot({ status, size = 6 }: { status?: string; size?: number }) {
  const color = status === "passed" ? "var(--ok)" : status === "warning" ? "var(--warn)" : status === "failed" ? "var(--err)" : "var(--text-3)";
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

function StatusPill({ s }: { s: string }) {
  const m: Record<string, { cls: string; label: string }> = { active: { cls: "badge-ok", label: "active" }, beta: { cls: "badge-info", label: "beta" }, draft: { cls: "badge-warn", label: "draft" }, suspended: { cls: "badge-err", label: "suspended" }, pending_review: { cls: "badge-warn", label: "pending review" } };
  const info = m[s] || { cls: "", label: s };
  return <span className={"badge badge-sm " + info.cls}><span className="dot"></span>{info.label}</span>;
}

function VisibilityBadge({ v }: { v: string }) {
  if (v === "public") return <span className="badge badge-sm"><Icon name="globe" size={10} /> public</span>;
  if (v === "internal") return <span className="badge badge-sm"><Icon name="building" size={10} /> internal</span>;
  if (v === "private") return <span className="badge badge-sm"><Icon name="lock" size={10} /> private</span>;
  return <span className="badge badge-sm"><Icon name="edit" size={10} /> {v}</span>;
}

function ProtocolBadge({ p }: { p: string }) {
  return <span className="badge badge-sm">{p || "JSONRPC"}</span>;
}

function CodeSnippet({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="snippet">
      <div className="snippet-head">
        <span className="tiny">{lang}</span>
        <button className="btn-ghost btn btn-sm" onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
          <Icon name={copied ? "check" : "copy"} size={12} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="code-block" style={{ borderTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>{code}</pre>
    </div>
  );
}

function TabBar({ tabs, active, onSelect }: { tabs: { id: string; label: string; icon?: string; count?: number }[]; active: string; onSelect: (id: string) => void }) {
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <button key={t.id} className={"tab" + (active === t.id ? " active" : "")} onClick={() => onSelect(t.id)}>
          {t.icon && <Icon name={t.icon} size={14} />}
          <span>{t.label}</span>
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function MetaRow({ k, children, mono }: { k: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="meta-row">
      <div className="meta-k">{k}</div>
      <div className={"meta-v" + (mono ? " mono" : "")}>{children}</div>
    </div>
  );
}

function CapTile({ on, label, icon }: { on: boolean; label: string; icon: string }) {
  return (
    <div className={"cap-tile" + (on ? " on" : "")}>
      <Icon name={icon} size={14} />
      <span style={{ flex: 1, fontSize: 12 }}>{label}</span>
      <span className={"badge badge-sm " + (on ? "badge-ok" : "")}>{on ? "on" : "off"}</span>
    </div>
  );
}

interface DetailData {
  service: Service;
  endpoints: Endpoint[];
  skills: Skill[];
  snapshot: AgentCardSnapshot | null;
  validationRuns: ValidationRun[];
}

function OverviewTab({ data }: { data: DetailData }) {
  const { service, skills, endpoints } = data;
  const baseUrl = endpoints[0]?.base_url ?? "";
  return (
    <div className="detail-overview">
      <div className="detail-overview-main">
        <section className="card section">
          <div className="section-head"><h3>About</h3></div>
          <p style={{ margin: 0, color: "var(--text)", lineHeight: 1.6, maxWidth: 720 }}>{service.description ?? "No description provided."}</p>
          {(service.tags?.length ?? 0) > 0 && (
            <div className="tag-row" style={{ marginTop: 12 }}>
              {service.tags!.map(t => <span key={t} className="tag">#{t}</span>)}
            </div>
          )}
        </section>

        <section className="card section">
          <div className="section-head">
            <h3>Skills</h3>
            <span className="muted mono" style={{ fontSize: 12 }}>{skills.length} skills declared</span>
          </div>
          {skills.length === 0 ? (
            <p className="muted">No skills declared yet.</p>
          ) : (
            <ul className="skills-list">
              {skills.map(s => (
                <li key={s.id} className="skill-item">
                  <div className="skill-item-head">
                    {s.external_skill_id && <span className="mono" style={{ fontSize: 12, color: "var(--signal)" }}>{s.external_skill_id}</span>}
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                  </div>
                  {s.description && <p className="muted" style={{ margin: "4px 0 8px", fontSize: 13 }}>{s.description}</p>}
                  {(s.tags?.length ?? 0) > 0 && (
                    <div className="skill-item-foot">
                      <div className="tag-row">
                        {s.tags!.map(t => <span key={t} className="tag" style={{ fontSize: 10.5, height: 18, padding: "0 6px" }}>{t}</span>)}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {baseUrl && (
          <section className="card section">
            <div className="section-head">
              <h3>Connect from a client agent</h3>
            </div>
            <CodeSnippet lang="bash" code={`# Send a JSON-RPC message to ${service.name}
curl -X POST ${baseUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{ "kind": "text", "text": "Hello" }]
      }
    }
  }'`} />
          </section>
        )}
      </div>

      <aside className="detail-overview-side">
        <div className="card section">
          <div className="tiny" style={{ marginBottom: 12 }}>Identity</div>
          <MetaRow k="Provider">{service.provider_name ?? "Unknown"}</MetaRow>
          {service.provider_url && <MetaRow k="Provider URL" mono>
            <a href={service.provider_url} target="_blank" rel="noopener" style={{ color: "var(--info)" }}>{service.provider_url}<Icon name="external" size={11} style={{ marginLeft: 4, display: "inline" }} /></a>
          </MetaRow>}
          {service.version && <MetaRow k="Version" mono>v{service.version}</MetaRow>}
          <MetaRow k="Status"><StatusPill s={service.status} /></MetaRow>
          <MetaRow k="Visibility"><VisibilityBadge v={service.visibility} /></MetaRow>
          {service.documentation_url && <MetaRow k="Docs" mono>
            <a href={service.documentation_url} target="_blank" rel="noopener" style={{ color: "var(--info)" }}>Documentation<Icon name="external" size={11} style={{ marginLeft: 4, display: "inline" }} /></a>
          </MetaRow>}
        </div>

        <div className="card section">
          <div className="tiny" style={{ marginBottom: 12 }}>Endpoints</div>
          {endpoints.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No endpoints configured.</p>
          ) : (
            endpoints.map(ep => (
              <div key={ep.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ProtocolBadge p={ep.protocol_binding ?? "JSONRPC"} />
                  {ep.is_preferred && <span className="badge badge-sm badge-signal"><span className="dot"></span>preferred</span>}
                </div>
                <div className="mono muted" style={{ fontSize: 11, marginTop: 2 }}>{ep.base_url ?? "No URL"}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function InterfacesTab({ endpoints }: { endpoints: Endpoint[] }) {
  return (
    <div className="card section" style={{ maxWidth: 880 }}>
      <div className="section-head">
        <h3>Endpoints</h3>
        <button className="btn btn-sm"><Icon name="plus" size={13} />Add endpoint</button>
      </div>
      {endpoints.length === 0 ? (
        <p className="muted">No endpoints configured.</p>
      ) : (
        <ul className="iface-list">
          {endpoints.map(ep => (
            <li key={ep.id} className="iface-item">
              <div className="iface-item-head">
                <ProtocolBadge p={ep.protocol_binding ?? "JSONRPC"} />
                {ep.protocol_version && <span className="muted mono" style={{ fontSize: 11 }}>v{ep.protocol_version}</span>}
                {ep.is_preferred && <span className="badge badge-sm badge-signal"><span className="dot"></span>preferred</span>}
              </div>
              <div className="iface-url mono">{ep.base_url ?? "No URL set"}</div>
              {ep.agent_card_url && <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>Card: {ep.agent_card_url}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CardTab({ snapshot }: { snapshot: AgentCardSnapshot | null }) {
  if (!snapshot) return <div className="card section"><p className="muted">No agent card snapshot available.</p></div>;
  return (
    <div className="detail-card-tab">
      <div className="card section" style={{ flex: 1, minWidth: 0 }}>
        <div className="section-head">
          <h3>Agent Card snapshot</h3>
          <button className="btn btn-sm"><Icon name="copy" size={12} />Copy</button>
        </div>
        <HighlightedJSON obj={snapshot.normalized_json ?? snapshot.raw_json} style={{ maxHeight: "calc(100vh - 280px)" }} />
      </div>
      <aside style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="card section">
          <div className="tiny" style={{ marginBottom: 10 }}>Snapshot</div>
          {snapshot.schema_version && <MetaRow k="Schema" mono>{snapshot.schema_version}</MetaRow>}
          {snapshot.checksum && <MetaRow k="Checksum" mono>{snapshot.checksum.slice(0, 16)}…</MetaRow>}
          <MetaRow k="Fetched" mono>{fmtAgo(snapshot.fetched_at)}</MetaRow>
        </div>
      </aside>
    </div>
  );
}

function ValidationTab({ runs, serviceId }: { runs: ValidationRun[]; serviceId: string }) {
  const [running, setRunning] = useState(false);
  const triggerValidation = async () => {
    setRunning(true);
    try { await api.validateService(serviceId); } catch {}
    setRunning(false);
  };

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div className="card section" style={{ flex: 1 }}>
        <div className="section-head">
          <h3>Validation history</h3>
          <button className="btn btn-sm" onClick={triggerValidation} disabled={running}>
            <Icon name="refresh" size={13} />{running ? "Running…" : "Run now"}
          </button>
        </div>
        {runs.length === 0 ? (
          <p className="muted">No validation runs yet. Click &quot;Run now&quot; to validate this service.</p>
        ) : (
          <table className="run-table">
            <thead><tr><th>When</th><th>Status</th><th>Score</th><th>Response</th></tr></thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id}>
                  <td>{fmtAgo(r.created_at)}</td>
                  <td><ValidationDot status={r.status} /> <span className="muted" style={{ fontSize: 12, marginLeft: 6 }}>{r.status}</span></td>
                  <td className="mono tnum">{r.score}</td>
                  <td className="mono tnum muted">{r.response_time_ms != null ? `${r.response_time_ms}ms` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TestConsoleEmbedded({ serviceId, skills, endpoints }: { serviceId: string; skills: Skill[]; endpoints: Endpoint[] }) {
  const [skillId, setSkillId] = useState<string>(skills[0]?.external_skill_id ?? "");
  const [input, setInput] = useState("Hello");
  const [showRaw, setShowRaw] = useState(false);
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [lastResponse, setLastResponse] = useState<unknown>(null);
  const [lastRequest, setLastRequest] = useState<unknown>(null);

  const baseUrl = endpoints[0]?.base_url ?? "";

  const send = async () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setMessages(m => [...m, { role: "user", text: input }]);
    try {
      const res = await api.sendTestRequest({ service_id: serviceId, skill_id: skillId || undefined, message: input });
      setLastRequest(res.raw_request);
      setLastResponse(res.raw_response);
      const agentMsgs = (res.messages as unknown[]).map((m) => {
        const msg = m as Record<string, unknown>;
        return { role: (msg.role as string) ?? "agent", text: typeof msg.text === "string" ? msg.text : JSON.stringify(msg) };
      });
      setMessages(m => [...m, ...agentMsgs]);
    } catch (err) {
      setMessages(m => [...m, { role: "error", text: err instanceof Error ? err.message : "Request failed" }]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="tc">
      <div className="tc-controls">
        <div className="tc-control">
          <div className="tiny">Endpoint</div>
          <div className="tc-endpoint mono">{baseUrl || "No endpoint configured"}</div>
        </div>
        {skills.length > 0 && (
          <div className="tc-control" style={{ minWidth: 200 }}>
            <div className="tiny">Skill</div>
            <select className="select" value={skillId} onChange={e => setSkillId(e.target.value)}>
              {skills.map(s => <option key={s.id} value={s.external_skill_id ?? s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <button className="btn btn-sm" style={{ marginTop: 18 }} onClick={() => { setMessages([]); setLastResponse(null); setLastRequest(null); }} disabled={messages.length === 0}>
          <Icon name="refresh" size={12} />Reset
        </button>
      </div>

      <div className="tc-grid">
        <div className="tc-pane">
          <div className="tc-pane-head">
            <span className="tiny">Conversation</span>
            {running && <span className="spin" style={{ display: "inline-block", width: 12, height: 12, border: "1.5px solid var(--line-strong)", borderTopColor: "var(--signal)", borderRadius: "50%" }}></span>}
          </div>
          <div className="tc-log">
            {messages.length === 0 && (
              <div className="tc-empty">
                <div className="tiny">No requests sent yet</div>
                <p className="muted" style={{ fontSize: 13, maxWidth: 280, textAlign: "center", marginTop: 6 }}>Pick a skill and send a message to test this agent.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={"tc-msg " + m.role + " slide-up"}>
                <div className="tc-msg-meta">
                  <span className="badge badge-sm">{m.role}</span>
                </div>
                <div className="tc-msg-body">{m.text}</div>
              </div>
            ))}
          </div>
          <div className="tc-input-row">
            <textarea className="textarea" rows={2} placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} />
            <button className="btn btn-primary" onClick={send} disabled={running || !input.trim()}>
              <Icon name="send" size={13} />Send
            </button>
          </div>
          <div className="tc-hint muted"><kbd>Ctrl</kbd><kbd>Enter</kbd> to send</div>
        </div>

        <div className="tc-pane">
          <div className="tc-pane-head">
            <span className="tiny">Raw transport</span>
            <div className="seg seg-sm">
              <button className={!showRaw ? "on" : ""} onClick={() => setShowRaw(false)}>Request</button>
              <button className={showRaw ? "on" : ""} onClick={() => setShowRaw(true)}>Response</button>
            </div>
          </div>
          <HighlightedJSON obj={showRaw ? (lastResponse ?? { status: "no response yet" }) : (lastRequest ?? { status: "no request sent" })} style={{ flex: 1, minHeight: 0, border: 0, borderRadius: 0 }} />
        </div>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [service, endpointsRes, skillsRes, snapshot, runsRes] = await Promise.allSettled([
        api.getService(id),
        api.listEndpoints(id),
        api.listSkills(id),
        api.getAgentCard(id),
        api.listValidationRuns(id),
      ]);
      if (service.status === "rejected") throw service.reason;
      setData({
        service: service.value,
        endpoints: endpointsRes.status === "fulfilled" ? endpointsRes.value.endpoints : [],
        skills: skillsRes.status === "fulfilled" ? skillsRes.value.skills : [],
        snapshot: snapshot.status === "fulfilled" ? snapshot.value : null,
        validationRuns: runsRes.status === "fulfilled" ? runsRes.value.runs : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load service");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="empty" style={{ padding: 60 }}><Icon name="activity" size={28} className="muted" /><h3>Loading service…</h3></div>;
  if (error || !data) return <div className="empty" style={{ padding: 60 }}><Icon name="alert" size={28} className="muted" /><h3>{error || "Not found"}</h3><button className="btn btn-sm" onClick={fetchData}><Icon name="refresh" size={13} />Retry</button></div>;

  const { service, endpoints, skills, snapshot, validationRuns } = data;
  const tabs = [
    { id: "overview", label: "Overview", icon: "cube" },
    { id: "interfaces", label: "Endpoints", icon: "link", count: endpoints.length },
    { id: "card", label: "Agent Card", icon: "fileJson" },
    { id: "validation", label: "Validation", icon: "shield", count: validationRuns.length || undefined },
    { id: "test", label: "Test console", icon: "terminal" },
  ];

  return (
    <div className="detail">
      <div className="detail-head">
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/")}>
          <Icon name="chevronLeft" size={14} />Registry
        </button>
        <Icon name="chevronRight" size={12} className="muted" />
        <span className="mono muted" style={{ fontSize: 12 }}>{service.provider_name ?? "Unknown"}</span>
        <Icon name="chevronRight" size={12} className="muted" />
        <span style={{ fontWeight: 500 }}>{service.name}</span>
      </div>

      <div className="detail-hero">
        <AgentMark name={service.name} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="detail-hero-title">
            <h1>{service.name}</h1>
            {service.version && <span className="badge badge-sm mono">v{service.version}</span>}
            <StatusPill s={service.status} />
            <VisibilityBadge v={service.visibility} />
          </div>
          <p className="detail-hero-desc">{service.description ?? "No description"}</p>
        </div>
        <div className="detail-hero-actions">
          <button className="btn btn-sm" onClick={() => setTab("test")}><Icon name="terminal" size={13} />Test</button>
          <button className="btn btn-primary btn-sm"><Icon name="bolt" size={13} />Use this agent</button>
        </div>
      </div>

      <TabBar tabs={tabs} active={tab} onSelect={setTab} />

      <div className="detail-body">
        {tab === "overview" && <OverviewTab data={data} />}
        {tab === "interfaces" && <InterfacesTab endpoints={endpoints} />}
        {tab === "card" && <CardTab snapshot={snapshot} />}
        {tab === "validation" && <ValidationTab runs={validationRuns} serviceId={id} />}
        {tab === "test" && <TestConsoleEmbedded serviceId={id} skills={skills} endpoints={endpoints} />}
      </div>
    </div>
  );
}
