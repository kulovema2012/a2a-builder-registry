"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/shared/icon";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

function generateKey(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return "pier_" + Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function mask(key: string) {
  return key.slice(0, 14) + "•".repeat(16);
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pier_api_keys");
      if (stored) setKeys(JSON.parse(stored));
    } catch {}
  }, []);

  function save(next: ApiKey[]) {
    setKeys(next);
    localStorage.setItem("pier_api_keys", JSON.stringify(next));
  }

  function handleCreate() {
    const key = generateKey();
    const entry: ApiKey = {
      id: crypto.randomUUID(),
      name: newName.trim() || "Unnamed key",
      key,
      scopes: ["read", "write"],
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };
    save([entry, ...keys]);
    setNewKey(key);
    setCreating(false);
    setNewName("");
  }

  function handleRevoke(id: string) {
    save(keys.filter((k) => k.id !== id));
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const apiUrl =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
      : "http://localhost:8000";

  return (
    <div className="activity-page">
      <div className="activity-head">
        <div>
          <div className="tiny">Settings</div>
          <h1>API keys</h1>
          <p className="muted">
            Authenticate requests from external systems and agents using API keys.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setCreating(true)}
        >
          <Icon name="plus" size={14} />
          New key
        </button>
      </div>

      {newKey && (
        <div
          className="card section"
          style={{
            border: "1px solid var(--ok)",
            background: "color-mix(in srgb, var(--ok) 8%, transparent)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <Icon name="check2" size={15} style={{ color: "var(--ok)" }} />
            <strong>Key created — copy it now, it won&apos;t be shown again.</strong>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code
              style={{
                flex: 1,
                fontSize: 13,
                background: "var(--surface-2)",
                padding: "8px 12px",
                borderRadius: 6,
                wordBreak: "break-all",
                border: "1px solid var(--line)",
              }}
            >
              {newKey}
            </code>
            <button
              className="btn btn-sm"
              onClick={() => handleCopy(newKey)}
            >
              <Icon name={copied ? "check2" : "copy"} size={13} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            className="btn btn-sm"
            style={{ marginTop: 10 }}
            onClick={() => setNewKey(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {creating && (
        <div className="card section" style={{ marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>New API key</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Key name — e.g. Production, CI pipeline, My agent"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCreate}
            >
              Generate
            </button>
            <button
              className="btn btn-sm"
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
            >
              Cancel
            </button>
          </div>
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            Keys are granted read + write scopes on your organization&apos;s resources.
          </p>
        </div>
      )}

      {keys.length === 0 && !creating ? (
        <div className="empty" style={{ padding: 60 }}>
          <Icon name="key" size={32} className="muted" />
          <h3>No API keys yet</h3>
          <p className="muted">
            Create a key to authenticate API requests from your agents or CI
            pipelines.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setCreating(true)}
          >
            <Icon name="plus" size={14} />
            Create first key
          </button>
        </div>
      ) : keys.length > 0 ? (
        <div className="approvals">
          {keys.map((k) => (
            <div
              key={k.id}
              className="card section"
              style={{ display: "flex", alignItems: "center", gap: 16 }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-2)",
                  flexShrink: 0,
                }}
              >
                <Icon name="key" size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 3,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{k.name}</span>
                  {k.scopes.map((s) => (
                    <span key={s} className="badge badge-sm">
                      {s}
                    </span>
                  ))}
                </div>
                <code style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {mask(k.key)}
                </code>
              </div>
              <div
                style={{
                  textAlign: "right",
                  minWidth: 150,
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                  Created {new Date(k.createdAt).toLocaleDateString()}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {k.lastUsedAt
                    ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                    : "Never used"}
                </div>
              </div>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleRevoke(k.id)}
              >
                <Icon name="trash" size={12} />
                Revoke
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="card section" style={{ marginTop: 24 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Usage</h3>
        <p className="muted" style={{ marginBottom: 12, fontSize: 14 }}>
          Include your key as a Bearer token in the{" "}
          <code>Authorization</code> header:
        </p>
        <pre
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 13,
            overflow: "auto",
            margin: 0,
          }}
        >{`curl -H "Authorization: Bearer <your-key>" \\
  ${apiUrl}/api/v1/registry/agents`}</pre>
      </div>
    </div>
  );
}
