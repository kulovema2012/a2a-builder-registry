"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, Button, Input, Textarea, Select } from "@/components/shared/ui";

interface SkillForm {
  name: string;
  description: string;
  tags: string;
  input_modes: string;
  output_modes: string;
}

export default function BuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [providerName, setProviderName] = useState("");
  const [providerUrl, setProviderUrl] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [baseUrl, setBaseUrl] = useState("");
  const [agentCardUrl, setAgentCardUrl] = useState("");
  const [protocolBinding, setProtocolBinding] = useState("JSONRPC");
  const [inputModes, setInputModes] = useState("text/plain");
  const [outputModes, setOutputModes] = useState("text/plain");
  const [streaming, setStreaming] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [extendedCard, setExtendedCard] = useState(false);
  const [skills, setSkills] = useState<SkillForm[]>([
    { name: "", description: "", tags: "", input_modes: "", output_modes: "" },
  ]);
  const [generatedCard, setGeneratedCard] = useState<Record<string, unknown> | null>(null);

  const addSkill = () => {
    setSkills([...skills, { name: "", description: "", tags: "", input_modes: "", output_modes: "" }]);
  };

  const updateSkill = (index: number, field: keyof SkillForm, value: string) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      const service = await api.createService({
        name,
        slug,
        description,
        provider_name: providerName,
        provider_url: providerUrl,
        version,
        visibility: "draft",
      } as any);

      // Add endpoint
      if (baseUrl) {
        await api.addEndpoint(service.id, {
          agent_card_url: agentCardUrl,
          base_url: baseUrl,
          protocol_binding: protocolBinding,
        } as any);
      }

      // Add skills
      for (const skill of skills) {
        if (skill.name.trim()) {
          await api.addSkill(service.id, {
            name: skill.name,
            description: skill.description,
            tags: skill.tags ? skill.tags.split(",").map(t => t.trim()) : [],
            input_modes: skill.input_modes ? skill.input_modes.split(",").map(m => m.trim()) : [],
            output_modes: skill.output_modes ? skill.output_modes.split(",").map(m => m.trim()) : [],
          } as any);
        }
      }

      // Generate Agent Card
      const cardData = {
        name,
        description,
        version,
        provider_organization: providerName,
        provider_url: providerUrl,
        url: baseUrl,
        default_input_modes: inputModes.split(",").map(m => m.trim()),
        default_output_modes: outputModes.split(",").map(m => m.trim()),
        capabilities: {
          streaming,
          pushNotifications: pushNotifications,
          extendedAgentCard: extendedCard,
        },
        skills: skills.filter(s => s.name.trim()).map(s => ({
          name: s.name,
          description: s.description,
          tags: s.tags ? s.tags.split(",").map(t => t.trim()) : [],
          input_modes: s.input_modes ? s.input_modes.split(",").map(m => m.trim()) : [],
          output_modes: s.output_modes ? s.output_modes.split(",").map(m => m.trim()) : [],
        })),
        endpoints: baseUrl ? [{ base_url: baseUrl, protocol_binding: protocolBinding, agent_card_url: agentCardUrl }] : [],
      };

      const snapshot = await api.generateAgentCard(service.id, cardData);
      setGeneratedCard(snapshot.raw_json);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent Card Builder</h1>
        <p className="text-[var(--text-secondary)] mt-1">Create an A2A-compatible service profile step by step</p>
      </div>

      {/* Progress Steps */}
      <div className="flex gap-2">
        {["Identity", "Endpoint", "Skills", "Review"].map((label, i) => (
          <button
            key={label}
            onClick={() => i + 1 < step && setStep(i + 1)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              step === i + 1 ? "bg-[var(--accent)] text-white" :
              step > i + 1 ? "bg-[var(--accent)]/20 text-[var(--accent)] cursor-pointer" :
              "bg-[var(--bg-hover)] text-[var(--text-muted)]"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">{error}</div>
      )}

      {/* Step 1: Identity */}
      {step === 1 && (
        <Card>
          <h3 className="font-semibold mb-4">Service Identity</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Service Name" value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 100)); }} placeholder="My Agent Service" />
              <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-agent-service" />
            </div>
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this agent service does..." />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Provider Organization" value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="Acme Inc" />
              <Input label="Provider URL" value={providerUrl} onChange={(e) => setProviderUrl(e.target.value)} placeholder="https://acme.com" />
            </div>
            <Input label="Version" value={version} onChange={(e) => setVersion(e.target.value)} />
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!name || !slug}>Next: Endpoint</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Endpoint */}
      {step === 2 && (
        <Card>
          <h3 className="font-semibold mb-4">Endpoint Configuration</h3>
          <div className="space-y-4">
            <Input label="Base URL" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com/a2a" />
            <Input label="Agent Card URL" value={agentCardUrl} onChange={(e) => setAgentCardUrl(e.target.value)} placeholder="https://api.example.com/.well-known/agent-card.json" />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Protocol Binding"
                value={protocolBinding}
                onChange={(e) => setProtocolBinding(e.target.value)}
                options={[
                  { value: "JSONRPC", label: "JSON-RPC" },
                  { value: "GRPC", label: "gRPC" },
                  { value: "HTTP+JSON", label: "HTTP + JSON" },
                ]}
              />
              <div />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Default Input Modes (comma-separated)" value={inputModes} onChange={(e) => setInputModes(e.target.value)} />
              <Input label="Default Output Modes (comma-separated)" value={outputModes} onChange={(e) => setOutputModes(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Capabilities</label>
              <div className="space-y-2">
                {[
                  { label: "Streaming", value: streaming, setter: setStreaming },
                  { label: "Push Notifications", value: pushNotifications, setter: setPushNotifications },
                  { label: "Extended Agent Card", value: extendedCard, setter: setExtendedCard },
                ].map((cap) => (
                  <label key={cap.label} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={cap.value} onChange={(e) => cap.setter(e.target.checked)} className="rounded border-[var(--border)] bg-[var(--bg-secondary)]" />
                    <span className="text-sm">{cap.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next: Skills</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Skills */}
      {step === 3 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Skills</h3>
            <Button variant="secondary" size="sm" onClick={addSkill}>+ Add Skill</Button>
          </div>
          <div className="space-y-6">
            {skills.map((skill, i) => (
              <div key={i} className="p-4 rounded-lg bg-[var(--bg-primary)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Skill {i + 1}</span>
                  {skills.length > 1 && (
                    <button onClick={() => removeSkill(i)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Name" value={skill.name} onChange={(e) => updateSkill(i, "name", e.target.value)} placeholder="translate-text" />
                  <Input label="Tags (comma-separated)" value={skill.tags} onChange={(e) => updateSkill(i, "tags", e.target.value)} placeholder="nlp, translation" />
                </div>
                <Textarea label="Description" value={skill.description} onChange={(e) => updateSkill(i, "description", e.target.value)} placeholder="What this skill does..." />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Input Modes" value={skill.input_modes} onChange={(e) => updateSkill(i, "input_modes", e.target.value)} placeholder="text/plain, application/json" />
                  <Input label="Output Modes" value={skill.output_modes} onChange={(e) => updateSkill(i, "output_modes", e.target.value)} placeholder="text/plain, application/json" />
                </div>
              </div>
            ))}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Creating..." : "Create & Generate Card"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && generatedCard && (
        <Card>
          <h3 className="font-semibold mb-4">Generated Agent Card</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Your A2A Agent Card has been generated. Review it below, then navigate to your service to validate and publish it.
          </p>
          <pre className="bg-[var(--bg-primary)] rounded-lg p-4 text-sm overflow-auto max-h-[500px] font-mono text-[var(--text-secondary)]">
            {JSON.stringify(generatedCard, null, 2)}
          </pre>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => router.push("/services")}>View Services</Button>
            <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(JSON.stringify(generatedCard, null, 2)); }}>
              Copy JSON
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
