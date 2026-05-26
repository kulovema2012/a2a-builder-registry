"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/icon";
import { api } from "@/lib/api";

export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!url.trim()) return;
    setImporting(true);
    setError("");
    try {
      const service = await api.importAgentCard(url.trim());
      router.push(`/services/${service.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1>Import Agent Card</h1>
        <p className="muted">Import an existing A2A Agent Card from a URL. We&apos;ll fetch, validate, and register the service.</p>
      </div>

      <div className="card section">
        <div className="field">
          <div className="label">Agent Card URL<span className="req">*</span></div>
          <input
            className="input mono"
            placeholder="https://example.com/.well-known/agent-card.json"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {error && <div className="help" style={{ color: "var(--err)" }}>{error}</div>}
        </div>

        <div style={{ background: "var(--surface-2)", borderRadius: 8, padding: 16, margin: "16px 0", fontSize: 13, color: "var(--text-2)" }}>
          <div style={{ fontWeight: 500, color: "var(--text-1)", marginBottom: 8 }}>What happens during import:</div>
          <ol style={{ listStyle: "decimal", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Fetches the Agent Card JSON from the URL</li>
            <li>Parses and normalizes the metadata</li>
            <li>Creates a service record with endpoints and skills</li>
            <li>Runs schema validation and endpoint checks</li>
            <li>Stores the snapshot with a checksum</li>
          </ol>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={handleImport}
          disabled={importing || !url.trim()}
        >
          <Icon name="download" size={14} />
          {importing ? "Importing…" : "Import Agent Card"}
        </button>
      </div>

      <div className="card section" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>Accepted URLs</div>
        <ul style={{ fontSize: 13, color: "var(--text-2)", display: "flex", flexDirection: "column", gap: 4 }}>
          <li><code className="mono" style={{ fontSize: 11, background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4 }}>https://your-agent.com/.well-known/agent-card.json</code></li>
          <li><code className="mono" style={{ fontSize: 11, background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4 }}>https://your-agent.com/agent-card.json</code></li>
          <li>Any URL returning a valid A2A Agent Card JSON object</li>
        </ul>
      </div>
    </div>
  );
}
