"use client";

import { useState, useEffect } from "react";
import { api, type Service, type TestResult } from "@/lib/api";
import { Card, Button, Input, Select } from "@/components/shared/ui";

export default function ConsolePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [method, setMethod] = useState("message/send");
  const [payload, setPayload] = useState('{\n  "message": {\n    "role": "user",\n    "parts": [\n      {\n        "type": "text",\n        "text": "Hello, what can you do?"\n      }\n    ]\n  }\n}');
  const [result, setResult] = useState<TestResult | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listServices({ page_size: "100" })
      .then((data) => setServices(data.items))
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!selectedService) return;
    setSending(true);
    setError("");
    setResult(null);

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      setError("Invalid JSON payload");
      setSending(false);
      return;
    }

    try {
      const res = await api.sendTestRequest({
        service_id: selectedService,
        method,
        payload: parsedPayload,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Test Console</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Send a sample A2A request to a registered service and inspect the response.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Request Panel */}
        <Card>
          <h3 className="font-semibold mb-4">Request</h3>
          <div className="space-y-4">
            <Select
              label="Service"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              options={[
                { value: "", label: "Select a service..." },
                ...services.map((s) => ({ value: s.id, label: `${s.name} (v${s.version})` })),
              ]}
            />
            <Input label="Method" value={method} onChange={(e) => setMethod(e.target.value)} />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Payload (JSON)</label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[250px]"
              />
            </div>

            <Button onClick={handleSend} disabled={!selectedService || sending} className="w-full">
              {sending ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </Card>

        {/* Response Panel */}
        <Card>
          <h3 className="font-semibold mb-4">Response</h3>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400 mb-4">
              {error}
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${result.success ? "text-green-400" : "text-red-400"}`}>
                  {result.success ? "Success" : "Failed"}
                </span>
                {result.status_code && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-[var(--bg-hover)]">
                    HTTP {result.status_code}
                  </span>
                )}
                {result.response_time_ms != null && (
                  <span className="text-xs text-[var(--text-muted)]">{result.response_time_ms}ms</span>
                )}
              </div>

              {result.error && (
                <div className="text-sm text-red-400 bg-red-500/5 rounded p-3">{result.error}</div>
              )}

              {result.response_body && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Response Body</label>
                  <pre className="bg-[var(--bg-primary)] rounded-lg p-4 text-sm overflow-auto max-h-[400px] font-mono text-[var(--text-secondary)]">
                    {JSON.stringify(result.response_body, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <p>Send a request to see the response here</p>
            </div>
          )}
        </Card>
      </div>

      {/* A2A Protocol Reference */}
      <Card>
        <h3 className="font-semibold mb-3">A2A JSON-RPC Methods</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { method: "message/send", desc: "Send a message to the agent" },
            { method: "message/stream", desc: "Send a message with streaming response" },
            { method: "tasks/get", desc: "Get a task by ID" },
            { method: "tasks/cancel", desc: "Cancel a running task" },
            { method: "tasks/push-notification", desc: "Set push notification config" },
            { method: "tasks/resubscribe", desc: "Resubscribe to task updates" },
            { method: "agent/card", desc: "Get the extended agent card" },
            { method: "agent/auth", desc: "Authenticate with the agent" },
          ].map((item) => (
            <button
              key={item.method}
              onClick={() => setMethod(item.method)}
              className={`p-3 rounded-lg text-left transition-colors ${
                method === item.method ? "bg-[var(--accent)]/10 border border-[var(--accent)]" : "bg-[var(--bg-primary)] border border-[var(--border)]"
              }`}
            >
              <code className="text-xs font-mono">{item.method}</code>
              <p className="text-xs text-[var(--text-muted)] mt-1">{item.desc}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
