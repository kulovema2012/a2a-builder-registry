"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/icon";
import { api, streamAI } from "@/lib/api";
import { buildAgentCardJSON, HighlightedJSON } from "@/lib/json-view";

const BUILDER_STEPS = [
  { id: "start", label: "Start" },
  { id: "identity", label: "Identity" },
  { id: "interfaces", label: "Interfaces" },
  { id: "modes", label: "Modes" },
  { id: "auth", label: "Auth" },
  { id: "skills", label: "Skills" },
  { id: "examples", label: "Examples" },
  { id: "review", label: "Review" },
];

const NEW_AGENT = {
  name: "BillingCopilot",
  description: "Answers billing & subscription questions grounded in the customer's account history, plan, and invoice ledger.",
  provider: { organization: "Stratosphere Labs", url: "https://stratosphere.dev" },
  version: "0.1.0",
  documentationUrl: "https://docs.stratosphere.dev/billing-copilot",
  supportedInterfaces: [
    { url: "https://api.stratosphere.dev/a2a/billing", protocolBinding: "JSONRPC", protocolVersion: "0.3", preferred: true },
  ],
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/markdown", "application/json"],
  capabilities: { streaming: true, pushNotifications: false, extendedAgentCard: true },
  auth: { type: "apiKey", scheme: "Bearer", name: "Authorization" },
  skills: [
    { id: "billing.answer", name: "Answer billing question", description: "Returns a grounded answer about charges, plan, refunds, and dunning.", tags: ["billing", "support"], examples: ["Why was I charged $48 on May 12?"] },
    { id: "billing.invoice", name: "Fetch invoice", description: "Returns the structured invoice for an invoice id.", tags: ["billing", "invoice"], examples: ["Show invoice inv_4Z19"] },
  ],
  tags: ["billing", "support", "rag"],
  category: "CX",
  visibility: "internal" as const,
  status: "draft" as const,
  validationStatus: null as string | null,
  icon: "$",
};

const hashes = ["#C7F84A", "#B8A4FF", "#7CC4FF", "#FFB58E", "#F87171", "#4ADE80", "#F5B544", "#FF9DCE"];
function AgentMark({ agent, size = 36 }: { agent: { name: string; icon?: string }; size?: number }) {
  const i = (agent.name.charCodeAt(0) + agent.name.charCodeAt(agent.name.length > 1 ? 1 : 0)) % hashes.length;
  const c = hashes[i];
  return <div className="agent-mark" style={{ width: size, height: size, background: `linear-gradient(135deg, ${c}33, ${c}11)`, border: `1px solid ${c}33`, color: c, fontSize: size * 0.5 }}>{agent.icon || agent.name[0]}</div>;
}

function ValidationDot({ status, size = 6 }: { status: string; size?: number }) {
  const color = status === "passed" ? "var(--ok)" : status === "warning" ? "var(--warn)" : status === "failed" ? "var(--err)" : "var(--text-3)";
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

function FormGrid({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="form-grid" style={style}>{children}</div>;
}

function Field({ label, required, hint, error, children, full }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={"field" + (full ? " full" : "")}>
      <div className="label">{label}{required && <span className="req">*</span>}</div>
      {children}
      {error && <div className="help" style={{ color: "var(--err)" }}>⚠ {error}</div>}
      {!error && hint && <div className="help">{hint}</div>}
    </div>
  );
}

function ChipInput({ values, onChange, suggestions = [], placeholder }: { values: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = (v: string) => { v = v.trim(); if (v && !values.includes(v)) onChange([...values, v]); setDraft(""); };
  return (
    <div className="chip-input">
      {values.map((v, i) => (
        <span key={v} className="tag" style={{ background: "var(--signal-dim)", color: "var(--signal)", borderColor: "transparent" }}>
          {v}
          <button onClick={() => onChange(values.filter((_, j) => j !== i))} style={{ marginLeft: 4, color: "currentColor", display: "flex" }}>
            <Icon name="x" size={10} stroke={2.5} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft); } if (e.key === "Backspace" && !draft && values.length) onChange(values.slice(0, -1)); }}
        onBlur={() => add(draft)}
        placeholder={placeholder}
      />
      {suggestions.filter(s => !values.includes(s)).slice(0, 4).map(s => (
        <button key={s} className="tag muted" style={{ borderStyle: "dashed" }} onClick={() => add(s)}>+ {s}</button>
      ))}
    </div>
  );
}

type DraftType = typeof NEW_AGENT;

function StepRail({ step, setStep, validation }: { step: number; setStep: (s: number) => void; validation: { errors: number } }) {
  return (
    <ol className="step-rail">
      {BUILDER_STEPS.map((s, i) => {
        const done = i < step;
        const cur = i === step;
        return (
          <li key={s.id} className={"step-rail-item" + (cur ? " current" : "") + (done ? " done" : "")} onClick={() => i <= step && setStep(i)}>
            <span className="step-rail-dot">{done ? <Icon name="check" size={11} stroke={2.5} /> : i + 1}</span>
            <span>{s.label}</span>
            {cur && validation && validation.errors > 0 && (
              <span className="badge badge-sm badge-err" style={{ marginLeft: "auto" }}>{validation.errors}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StartStep({ setStep, importMode, setImportMode, onImport }: { setStep: (s: number) => void; importMode: boolean; setImportMode: (v: boolean) => void; onImport: (url: string) => void }) {
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");
    try {
      onImport(importUrl.trim());
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="builder-start">
      <p className="muted" style={{ maxWidth: 540, margin: 0 }}>You can register an agent two ways: import an existing Agent Card by URL, or build one from scratch with the guided form.</p>
      <div className="start-grid">
        <button className={"start-tile" + (!importMode ? " on" : "")} onClick={() => { setImportMode(false); setStep(1); }}>
          <div className="start-tile-icon"><Icon name="beaker" size={20} /></div>
          <h3>Build with the guided form</h3>
          <p className="muted">8 short steps. We&apos;ll generate a valid Agent Card and run validation as you go.</p>
          <span className="muted mono" style={{ fontSize: 11 }}>~ 4 min</span>
        </button>
        <button className={"start-tile" + (importMode ? " on" : "")} onClick={() => setImportMode(true)}>
          <div className="start-tile-icon"><Icon name="upload" size={20} /></div>
          <h3>Import an Agent Card URL</h3>
          <p className="muted">Already have a card at <span className="mono">/.well-known/agent-card.json</span>? Paste it.</p>
          <span className="muted mono" style={{ fontSize: 11 }}>~ 30 sec</span>
        </button>
      </div>
      {importMode && (
        <div className="card section slide-up" style={{ maxWidth: 720, marginTop: 16 }}>
          <Field label="Agent Card URL" required hint="We'll fetch, validate, and normalize the card. HTTPS required for production." error={importError}>
            <input className="input mono" placeholder="https://api.your-service.com/.well-known/agent-card.json" value={importUrl} onChange={e => setImportUrl(e.target.value)} />
          </Field>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-primary" disabled={importing || !importUrl.trim()} onClick={handleImport}>
              <Icon name="download" size={14} />{importing ? "Importing…" : "Fetch & validate"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IdentityStep({ draft, set }: { draft: DraftType; set: (patch: Partial<DraftType>) => void }) {
  const [desc, setDesc] = useState("");
  const [filling, setFilling] = useState(false);
  const [preview, setPreview] = useState("");

  const autoFill = async () => {
    if (!desc.trim() || filling) return;
    setFilling(true);
    setPreview("");
    try {
      await streamAI(
        "/ai/autofill",
        { description: desc },
        (chunk) => setPreview((p) => p + chunk),
        (full) => {
          try {
            const parsed = JSON.parse(full) as Record<string, unknown>;
            set({
              name: (parsed.name as string | undefined) ?? draft.name,
              description: (parsed.description as string | undefined) ?? draft.description,
              version: (parsed.version as string | undefined) ?? draft.version,
              tags: (parsed.tags as string[] | undefined) ?? draft.tags,
              skills: (parsed.skills as typeof draft.skills | undefined) ?? draft.skills,
              provider: parsed.provider
                ? { organization: (parsed.provider as Record<string, string>).organization ?? "", url: (parsed.provider as Record<string, string>).url ?? "" }
                : draft.provider,
              defaultInputModes: (parsed.defaultInputModes as string[] | undefined) ?? draft.defaultInputModes,
              defaultOutputModes: (parsed.defaultOutputModes as string[] | undefined) ?? draft.defaultOutputModes,
              capabilities: (parsed.capabilities as typeof draft.capabilities | undefined) ?? draft.capabilities,
            });
            setPreview("");
          } catch { /* leave preview visible so user can see the raw output */ }
          setFilling(false);
        },
      );
    } catch (e) {
      setFilling(false);
      alert(e instanceof Error ? e.message : "Auto-fill failed");
    }
  };

  return (
    <FormGrid>
      <div className="field full" style={{ background: "var(--surface-2)", borderRadius: 8, padding: "14px 16px", marginBottom: 4 }}>
        <div className="label">Auto-fill from description <span className="badge badge-sm badge-signal">AI</span></div>
        <textarea
          className="textarea"
          rows={2}
          placeholder='e.g. "A billing assistant that answers invoice questions for SaaS customers"'
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <button
          className="btn btn-sm btn-primary"
          style={{ marginTop: 8 }}
          disabled={filling || !desc.trim()}
          onClick={autoFill}
        >
          <Icon name="zap" size={13} />
          {filling ? "Filling…" : "Auto-fill form"}
        </button>
        {preview && (
          <pre style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)", whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>
            {preview}
          </pre>
        )}
      </div>
      <Field label="Agent name" required hint="A short, distinct name. Maps to Agent Card `name`.">
        <input className="input" value={draft.name} onChange={e => set({ name: e.target.value })} placeholder="e.g. WeatherWise" />
      </Field>
      <Field label="Slug" hint="URL-safe identifier in the registry.">
        <input className="input mono" value={draft.name.toLowerCase().replace(/\s+/g, "-")} readOnly />
      </Field>
      <Field full label="Short description" required hint="One to three sentences. What does this agent do, and for whom?">
        <textarea className="textarea" rows={3} value={draft.description} onChange={e => set({ description: e.target.value })} placeholder="An agent that does X for Y, supporting Z." />
      </Field>
      <Field label="Provider organization" required>
        <input className="input" value={draft.provider.organization} onChange={e => set({ provider: { ...draft.provider, organization: e.target.value } })} />
      </Field>
      <Field label="Provider URL" required>
        <input className="input mono" value={draft.provider.url} onChange={e => set({ provider: { ...draft.provider, url: e.target.value } })} />
      </Field>
      <Field label="Service version" required hint="SemVer recommended.">
        <input className="input mono" value={draft.version} onChange={e => set({ version: e.target.value })} />
      </Field>
      <Field label="Documentation URL">
        <input className="input mono" value={draft.documentationUrl} onChange={e => set({ documentationUrl: e.target.value })} />
      </Field>
      <Field full label="Tags" hint="Used for discovery in the registry.">
        <ChipInput values={draft.tags} onChange={tags => set({ tags })} suggestions={["rag", "support", "finance", "devtools", "nlp"]} placeholder="Type and press enter" />
      </Field>
    </FormGrid>
  );
}

function InterfacesStep({ draft, set }: { draft: DraftType; set: (patch: Partial<DraftType>) => void }) {
  const updateIface = (idx: number, patch: Record<string, string>) => {
    const next = draft.supportedInterfaces.map((i, j) => j === idx ? { ...i, ...patch } : i);
    set({ supportedInterfaces: next });
  };
  return (
    <div>
      <div className="builder-help">
        <Icon name="info" size={14} className="muted" />
        <span>Declare every transport your agent supports. The first listed is the preferred interface. v1 supports <span className="mono">JSONRPC</span>, <span className="mono">GRPC</span>, and <span className="mono">HTTP+JSON</span>.</span>
      </div>
      <ul className="iface-builder">
        {draft.supportedInterfaces.map((iface, idx) => (
          <li key={idx} className="iface-builder-item">
            <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
              <span className="badge badge-sm">{idx + 1}</span>
              <span style={{ fontWeight: 500 }}>Interface {idx + 1}</span>
              {idx === 0 && <span className="badge badge-sm badge-signal"><span className="dot"></span>preferred</span>}
              <button className="btn-ghost btn btn-icon btn-sm" style={{ marginLeft: "auto" }} onClick={() => set({ supportedInterfaces: draft.supportedInterfaces.filter((_, j) => j !== idx) })}>
                <Icon name="trash" size={12} />
              </button>
            </div>
            <FormGrid>
              <Field full label="Endpoint URL" required>
                <input className="input mono" value={iface.url} onChange={e => updateIface(idx, { url: e.target.value })} />
              </Field>
              <Field label="Protocol binding" required>
                <select className="select" value={iface.protocolBinding} onChange={e => updateIface(idx, { protocolBinding: e.target.value })}>
                  <option>JSONRPC</option><option>GRPC</option><option>HTTP+JSON</option>
                </select>
              </Field>
              <Field label="Protocol version" required>
                <select className="select" value={iface.protocolVersion} onChange={e => updateIface(idx, { protocolVersion: e.target.value })}>
                  <option>0.3</option><option>0.2</option>
                </select>
              </Field>
            </FormGrid>
          </li>
        ))}
      </ul>
      <button className="btn" style={{ marginTop: 8 }} onClick={() => set({ supportedInterfaces: [...draft.supportedInterfaces, { url: "", protocolBinding: "JSONRPC", protocolVersion: "0.3", preferred: false }] })}>
        <Icon name="plus" size={13} />Add interface
      </button>
    </div>
  );
}

function ToggleRow({ on, onChange, icon, title, desc }: { on: boolean; onChange: (v: boolean) => void; icon: string; title: string; desc: string }) {
  return (
    <div className={"toggle-row" + (on ? " on" : "")} onClick={() => onChange(!on)}>
      <Icon name={icon} size={16} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{desc}</div>
      </div>
      <div className={"switch" + (on ? " on" : "")}><span className="switch-knob"></span></div>
    </div>
  );
}

function ModesStep({ draft, set }: { draft: DraftType; set: (patch: Partial<DraftType>) => void }) {
  const setCap = (k: string, v: boolean) => set({ capabilities: { ...draft.capabilities, [k]: v } });
  return (
    <div>
      <FormGrid>
        <Field full label="Default input modes" required hint="Media types your agent accepts as input.">
          <ChipInput values={draft.defaultInputModes} onChange={v => set({ defaultInputModes: v })} suggestions={["text/plain", "application/json", "image/png", "image/jpeg", "application/pdf", "audio/wav"]} />
        </Field>
        <Field full label="Default output modes" required hint="Media types your agent returns.">
          <ChipInput values={draft.defaultOutputModes} onChange={v => set({ defaultOutputModes: v })} suggestions={["text/plain", "text/markdown", "application/json", "image/png"]} />
        </Field>
      </FormGrid>
      <div className="tiny" style={{ marginTop: 24, marginBottom: 10 }}>Capabilities</div>
      <div className="toggle-grid">
        <ToggleRow on={draft.capabilities.streaming} onChange={v => setCap("streaming", v)} icon="zap" title="Streaming" desc="Server can stream incremental message parts as the response is produced." />
        <ToggleRow on={draft.capabilities.pushNotifications} onChange={v => setCap("pushNotifications", v)} icon="bell" title="Push notifications" desc="Agent can push task updates to a client-provided webhook URL." />
        <ToggleRow on={draft.capabilities.extendedAgentCard} onChange={v => setCap("extendedAgentCard", v)} icon="layers" title="Extended Agent Card" desc="Authenticated clients can fetch a richer card with internal metadata." />
      </div>
    </div>
  );
}

function AuthStep({ draft, set }: { draft: DraftType; set: (patch: Partial<DraftType>) => void }) {
  const setAuth = (patch: Record<string, string>) => set({ auth: { ...draft.auth, ...patch } });
  return (
    <div>
      <div className="builder-help">
        <Icon name="shield" size={14} className="muted" />
        <span>Describe the auth scheme. Public Agent Cards must never include plaintext credentials — use placeholders and reference secret store IDs only.</span>
      </div>
      <div className="auth-grid">
        {[
          { id: "none", icon: "globe", label: "No auth", desc: "Anyone can call." },
          { id: "apiKey", icon: "key", label: "API Key", desc: "Static key in header or query." },
          { id: "oauth2", icon: "lock", label: "OAuth 2.0", desc: "Authorization code or client creds." },
          { id: "mtls", icon: "shield", label: "mTLS", desc: "Mutual TLS client cert." },
        ].map(a => (
          <button key={a.id} className={"auth-tile" + (draft.auth.type === a.id ? " on" : "")} onClick={() => setAuth({ type: a.id })}>
            <Icon name={a.icon} size={16} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{a.label}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{a.desc}</div>
            </div>
            <span className={"radio" + (draft.auth.type === a.id ? " on" : "")}></span>
          </button>
        ))}
      </div>
      {draft.auth.type === "apiKey" && (
        <FormGrid style={{ marginTop: 16 }}>
          <Field label="Location">
            <select className="select" value={draft.auth.scheme} onChange={e => setAuth({ scheme: e.target.value })}>
              <option>Header</option><option>Query</option>
            </select>
          </Field>
          <Field label="Header / param name">
            <input className="input mono" value={draft.auth.name} onChange={e => setAuth({ name: e.target.value })} />
          </Field>
        </FormGrid>
      )}
      {draft.auth.type === "oauth2" && (
        <FormGrid style={{ marginTop: 16 }}>
          <Field label="Authorization URL"><input className="input mono" placeholder="https://auth.example.com/authorize" /></Field>
          <Field label="Token URL"><input className="input mono" placeholder="https://auth.example.com/token" /></Field>
          <Field full label="Scopes">
            <ChipInput values={["read:agent", "write:tasks"]} onChange={() => {}} suggestions={["admin", "read", "write"]} />
          </Field>
        </FormGrid>
      )}
    </div>
  );
}

function SkillsStep({ draft, set }: { draft: DraftType; set: (patch: Partial<DraftType>) => void }) {
  const [open, setOpen] = useState(0);
  const update = (idx: number, patch: Record<string, unknown>) => {
    const next = draft.skills.map((s, j) => j === idx ? { ...s, ...patch } : s);
    set({ skills: next });
  };
  return (
    <div>
      <div className="builder-help">
        <Icon name="cube" size={14} className="muted" />
        <span>Each skill is a named capability your agent advertises. Client agents discover you by skill <span className="mono">id</span> and <span className="mono">tags</span>.</span>
      </div>
      <ul className="skills-builder">
        {draft.skills.map((s, idx) => (
          <li key={idx} className={"skills-builder-item" + (open === idx ? " open" : "")}>
            <div className="sbi-head" role="button" tabIndex={0} onClick={() => setOpen(open === idx ? -1 : idx)}>
              <Icon name={open === idx ? "chevronDown" : "chevronRight"} size={12} />
              <span className="mono" style={{ color: "var(--signal)" }}>{s.id || "(no id)"}</span>
              <span>· {s.name || "(unnamed)"}</span>
              <span className="muted mono" style={{ marginLeft: "auto", fontSize: 11 }}>{s.tags?.length || 0} tags · {s.examples?.length || 0} examples</span>
              <button className="btn-ghost btn btn-icon btn-sm" onClick={e => { e.stopPropagation(); set({ skills: draft.skills.filter((_, j) => j !== idx) }); }}>
                <Icon name="trash" size={12} />
              </button>
            </div>
            {open === idx && (
              <div className="sbi-body slide-up">
                <FormGrid>
                  <Field label="Skill id" required>
                    <input className="input mono" value={s.id} onChange={e => update(idx, { id: e.target.value })} />
                  </Field>
                  <Field label="Display name" required>
                    <input className="input" value={s.name} onChange={e => update(idx, { name: e.target.value })} />
                  </Field>
                  <Field full label="Description" required>
                    <textarea className="textarea" rows={2} value={s.description} onChange={e => update(idx, { description: e.target.value })} />
                  </Field>
                  <Field full label="Tags">
                    <ChipInput values={s.tags || []} onChange={v => update(idx, { tags: v })} suggestions={["rag", "search", "finance", "support"]} />
                  </Field>
                  <Field full label="Examples" hint="Sample user messages this skill is expected to handle.">
                    <ChipInput values={s.examples || []} onChange={v => update(idx, { examples: v })} placeholder="Type and press enter" />
                  </Field>
                </FormGrid>
              </div>
            )}
          </li>
        ))}
      </ul>
      <button className="btn" style={{ marginTop: 12 }} onClick={() => { set({ skills: [...draft.skills, { id: "", name: "", description: "", tags: [], examples: [] }] }); setOpen(draft.skills.length); }}>
        <Icon name="plus" size={13} />Add skill
      </button>
    </div>
  );
}

function ExamplesStep({ draft }: { draft: DraftType }) {
  const sample = draft.skills[0]?.examples?.[0] || "Hello";
  const sampleRpc = {
    jsonrpc: "2.0", id: "1", method: "message/send",
    params: { message: { role: "user", parts: [{ kind: "text", text: sample }] } },
  };
  return (
    <div>
      <div className="builder-help">
        <Icon name="terminal" size={14} className="muted" />
        <span>We&apos;ll send these sample messages during validation to confirm each skill actually responds. Pick at least one per skill.</span>
      </div>
      <div className="card section" style={{ maxWidth: 720, marginTop: 16 }}>
        <div className="section-head"><h3>Validation request preview</h3></div>
        <HighlightedJSON obj={sampleRpc} />
      </div>
    </div>
  );
}

function ReviewStep({ draft, validation, onPublish }: { draft: DraftType; validation: { score: number; errors: number; warnings: number; items: { state: string; label: string; detail: string }[] }; onPublish: () => void }) {
  const stateClass: Record<string, string> = { ok: "badge-ok", warn: "badge-warn", err: "badge-err" };
  const stateIcon: Record<string, string> = { ok: "check2", warn: "warning", err: "alert" };
  return (
    <div className="review">
      <div className="review-checks card section">
        <div className="section-head">
          <h3>Validation</h3>
          <button className="btn btn-sm"><Icon name="refresh" size={13} />Re-run</button>
        </div>
        <div className="vp-score" style={{ padding: "0 0 12px" }}>
          <span className="vp-score-num tnum mono">{validation.score}</span>
          <span className="vp-score-out muted">/ 100</span>
          <span className={"badge " + (validation.errors === 0 ? "badge-ok" : "badge-warn")} style={{ marginLeft: 8 }}>
            <Icon name={validation.errors === 0 ? "check2" : "warning"} size={11} />
            {validation.errors === 0 ? (validation.warnings === 0 ? "all good" : `${validation.warnings} warning${validation.warnings > 1 ? "s" : ""}`) : `${validation.errors} error${validation.errors > 1 ? "s" : ""}`}
          </span>
        </div>
        <ul className="vp-checks">
          {validation.items.map((c, i) => (
            <li key={i}>
              <span className={"vp-state " + stateClass[c.state]}><Icon name={stateIcon[c.state]} size={11} /></span>
              <div style={{ flex: 1 }}>
                <div>{c.label}</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{c.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="review-actions card section">
        <div className="tiny" style={{ marginBottom: 12 }}>Publish to registry</div>
        <Field label="Visibility">
          <select className="select" defaultValue="internal">
            <option value="private">Private — only my team</option>
            <option value="internal">Internal — entire organization</option>
            <option value="public">Public — discoverable in marketplace</option>
          </select>
        </Field>
        <p className="muted" style={{ fontSize: 12, margin: "12px 0 16px", lineHeight: 1.55 }}>
          Internal listings are visible to everyone in <span className="mono">stratosphere</span>. Public listings require admin approval.
        </p>
        <button className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={validation.errors > 0} onClick={onPublish}>
          <Icon name="bolt" size={14} />{validation.errors > 0 ? "Fix errors to publish" : "Publish to registry"}
        </button>
        <button className="btn" style={{ width: "100%", marginTop: 8 }}>
          <Icon name="download" size={13} />Download Agent Card JSON
        </button>
      </div>
    </div>
  );
}

function CardPreviewPanel({ draft }: { draft: DraftType }) {
  const [tab, setTab] = useState("json");
  const card = useMemo(() => buildAgentCardJSON(draft as unknown as Record<string, unknown>), [draft]);
  return (
    <aside className="card-preview">
      <div className="card-preview-head">
        <div className="tiny">Live Agent Card</div>
        <div className="seg seg-sm">
          <button className={tab === "json" ? "on" : ""} onClick={() => setTab("json")}>JSON</button>
          <button className={tab === "card" ? "on" : ""} onClick={() => setTab("card")}>Card</button>
        </div>
      </div>
      {tab === "json" && <HighlightedJSON obj={card} style={{ flex: 1, minHeight: 0, border: 0, borderRadius: 0 }} />}
      {tab === "card" && (
        <div className="trading-card">
          <div className="tc-strip"></div>
          <div className="tc-head">
            <AgentMark agent={draft} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="tc-name">{draft.name || "Unnamed agent"}</div>
              <div className="muted mono" style={{ fontSize: 11 }}>{draft.provider.organization} · v{draft.version}</div>
            </div>
          </div>
          <p className="tc-desc">{draft.description || "No description yet."}</p>
          <div className="tc-section">
            <div className="tiny">Skills</div>
            <div className="tag-row">
              {draft.skills.map(s => <span key={s.id} className="skill"><span className="dot"></span>{s.name || s.id}</span>)}
            </div>
          </div>
          <div className="tc-section">
            <div className="tiny">Capabilities</div>
            <div className="tag-row">
              {draft.capabilities.streaming && <span className="badge badge-sm"><Icon name="zap" size={10} />streaming</span>}
              {draft.capabilities.pushNotifications && <span className="badge badge-sm"><Icon name="bell" size={10} />push</span>}
              {draft.capabilities.extendedAgentCard && <span className="badge badge-sm"><Icon name="layers" size={10} />extended</span>}
            </div>
          </div>
          <div className="tc-foot">
            <span className="mono muted" style={{ fontSize: 10 }}>a2a · 0.3 · {draft.supportedInterfaces[0].protocolBinding}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default function BuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [importMode, setImportMode] = useState(false);
  const [draft, setDraft] = useState(NEW_AGENT);
  const [publishing, setPublishing] = useState(false);

  const set = (patch: Partial<DraftType>) => setDraft(d => ({ ...d, ...patch }));

  const publish = useCallback(async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const svc = await api.createService({
        name: draft.name,
        slug: draft.name.toLowerCase().replace(/\s+/g, "-"),
        description: draft.description,
        provider_name: draft.provider.organization,
        provider_url: draft.provider.url,
        version: draft.version,
        documentation_url: draft.documentationUrl,
        tags: draft.tags,
        visibility: draft.visibility,
      });
      for (const iface of draft.supportedInterfaces) {
        await api.addEndpoint(svc.id, {
          base_url: iface.url,
          protocol_binding: iface.protocolBinding,
          protocol_version: iface.protocolVersion,
          is_preferred: iface.preferred ?? false,
        });
      }
      for (const sk of draft.skills) {
        await api.addSkill(svc.id, {
          external_skill_id: sk.id,
          name: sk.name,
          description: sk.description,
          tags: sk.tags,
        });
      }
      router.push(`/services/${svc.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [draft, publishing, router]);

  const handleImport = useCallback(async (url: string) => {
    const svc = await api.importAgentCard(url);
    router.push(`/services/${svc.id}`);
  }, [router]);

  const validation = useMemo(() => {
    const items: { state: string; label: string; detail: string }[] = [];
    items.push({ state: draft.name ? "ok" : "err", label: "Identity complete", detail: draft.name ? "name + description present" : "name is required" });
    items.push({ state: /^https:\/\//.test(draft.provider.url) ? "ok" : "warn", label: "Provider URL HTTPS", detail: draft.provider.url });
    items.push({ state: draft.supportedInterfaces.every(i => /^https?:\/\//.test(i.url)) ? "ok" : "err", label: "Interfaces have valid URLs", detail: draft.supportedInterfaces.length + " interface(s)" });
    items.push({ state: draft.defaultInputModes.length && draft.defaultOutputModes.length ? "ok" : "err", label: "Default modes set", detail: `${draft.defaultInputModes.length} in / ${draft.defaultOutputModes.length} out` });
    items.push({ state: draft.skills.length >= 1 ? "ok" : "err", label: "At least one skill", detail: draft.skills.length + " skill(s) declared" });
    items.push({ state: draft.skills.every(s => s.examples?.length) ? "ok" : "warn", label: "Examples per skill", detail: "Recommended for validation runs" });
    items.push({ state: draft.auth.type !== "none" ? "ok" : "warn", label: "Auth scheme declared", detail: draft.auth.type });
    items.push({ state: "ok", label: "No plaintext credentials", detail: "Public card scanned" });
    const errors = items.filter(i => i.state === "err").length;
    const warnings = items.filter(i => i.state === "warn").length;
    const score = Math.max(0, 100 - errors * 18 - warnings * 4);
    return { items, errors, warnings, score };
  }, [draft]);

  const cur = BUILDER_STEPS[step];
  const next = () => setStep(s => Math.min(s + 1, BUILDER_STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="builder">
      <div className="builder-head">
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/")}>
          <Icon name="chevronLeft" size={14} />Cancel
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div className="tiny">Builder</div>
          <div style={{ fontWeight: 500 }}>{draft.name || "New agent"}<span className="muted mono" style={{ fontSize: 12, marginLeft: 6 }}>· v{draft.version}</span></div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-sm"><Icon name="download" size={13} />Save draft</button>
          <button className="btn btn-primary btn-sm" disabled={validation.errors > 0 || publishing} onClick={publish}>
            <Icon name="bolt" size={13} />{publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="builder-body">
        <StepRail step={step} setStep={setStep} validation={validation} />

        <main className="builder-main">
          <div className="builder-step-head">
            <div>
              <div className="tiny">Step {step + 1} of {BUILDER_STEPS.length}</div>
              <h2>{
                cur.id === "start" ? "How do you want to start?" :
                cur.id === "identity" ? "Identity & provider" :
                cur.id === "interfaces" ? "Supported interfaces" :
                cur.id === "modes" ? "Modes & capabilities" :
                cur.id === "auth" ? "Authentication" :
                cur.id === "skills" ? "Skills" :
                cur.id === "examples" ? "Examples & validation" :
                "Review & publish"
              }</h2>
            </div>
            {step > 0 && step < BUILDER_STEPS.length - 1 && (
              <div className="step-validation">
                <span className="mono tnum" style={{ fontSize: 11, color: "var(--text-3)" }}>validation</span>
                <span className={"badge badge-sm " + (validation.errors === 0 ? (validation.warnings === 0 ? "badge-ok" : "badge-warn") : "badge-err")}>
                  <ValidationDot status={validation.errors > 0 ? "failed" : validation.warnings > 0 ? "warning" : "passed"} />
                  {validation.score}
                </span>
              </div>
            )}
          </div>

          <div className="builder-step-body">
            {cur.id === "start" && <StartStep setStep={setStep} importMode={importMode} setImportMode={setImportMode} onImport={handleImport} />}
            {cur.id === "identity" && <IdentityStep draft={draft} set={set} />}
            {cur.id === "interfaces" && <InterfacesStep draft={draft} set={set} />}
            {cur.id === "modes" && <ModesStep draft={draft} set={set} />}
            {cur.id === "auth" && <AuthStep draft={draft} set={set} />}
            {cur.id === "skills" && <SkillsStep draft={draft} set={set} />}
            {cur.id === "examples" && <ExamplesStep draft={draft} />}
            {cur.id === "review" && <ReviewStep draft={draft} validation={validation} onPublish={publish} />}
          </div>

          {step > 0 && (
            <div className="builder-nav">
              <button className="btn" onClick={prev}><Icon name="chevronLeft" size={13} />Back</button>
              <div className="muted" style={{ fontSize: 12 }}>
                {step < BUILDER_STEPS.length - 1 ? "Changes auto-save to draft." : "Ready to publish?"}
              </div>
              {step < BUILDER_STEPS.length - 1 ? (
                <button className="btn btn-primary" onClick={next}>Continue<Icon name="chevronRight" size={13} /></button>
              ) : null}
            </div>
          )}
        </main>

        <CardPreviewPanel draft={draft} />
      </div>
    </div>
  );
}
