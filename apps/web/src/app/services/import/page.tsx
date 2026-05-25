"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Service } from "@/lib/api";
import { Card, Button, Input } from "@/components/shared/ui";

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Agent Card</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Import an existing A2A Agent Card from a URL. The system will fetch, validate, and register the service.
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <Input
            label="Agent Card URL"
            placeholder="https://example.com/.well-known/agent-card.json"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={error}
          />

          <div className="bg-[var(--bg-primary)] rounded-lg p-4 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)] mb-2">What happens during import:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Fetches the Agent Card JSON from the URL</li>
              <li>Parses and normalizes the metadata</li>
              <li>Creates a service record with endpoints and skills</li>
              <li>Runs schema validation and endpoint checks</li>
              <li>Stores the snapshot with a checksum</li>
            </ol>
          </div>

          <Button onClick={handleImport} disabled={importing || !url.trim()} className="w-full">
            {importing ? "Importing..." : "Import Agent Card"}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-2">Accepted URLs</h3>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
          <li>&bull; <code className="text-xs bg-[var(--bg-hover)] px-1 rounded">https://your-agent.com/.well-known/agent-card.json</code></li>
          <li>&bull; <code className="text-xs bg-[var(--bg-hover)] px-1 rounded">https://your-agent.com/agent-card.json</code></li>
          <li>&bull; Any URL returning a valid A2A Agent Card JSON object</li>
        </ul>
      </Card>
    </div>
  );
}
