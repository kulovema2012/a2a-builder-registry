"use client";

import { useState } from "react";
import { Icon } from "@/components/shared/icon";
import { useAuth } from "@/lib/auth-context";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card section" style={{ marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <label
      style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
      onClick={() => setChecked((v) => !v)}
    >
      <div
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: checked ? "var(--signal)" : "var(--line)",
          position: "relative",
          flexShrink: 0,
          marginTop: 2,
          transition: "background 0.15s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "white",
            transition: "left 0.15s",
          }}
        />
      </div>
      <div>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
        <div className="muted" style={{ fontSize: 13 }}>
          {description}
        </div>
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedOrg, setSavedOrg] = useState(false);

  function flash(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  return (
    <div className="activity-page">
      <div className="activity-head">
        <div>
          <div className="tiny">Settings</div>
          <h1>Settings</h1>
          <p className="muted">
            Manage your profile, organization details, and workspace preferences.
          </p>
        </div>
      </div>

      <Section title="Profile">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 4 }}>
              Full name
            </label>
            <input
              className="input"
              defaultValue={user?.name ?? ""}
              placeholder="Your name"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 4 }}>
              Email address
            </label>
            <input
              className="input"
              type="email"
              defaultValue={user?.email ?? ""}
              disabled
              style={{ width: "100%", opacity: 0.65 }}
            />
          </div>
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 4 }}>
              Role
            </label>
            <input
              className="input"
              defaultValue={user?.role ?? "member"}
              disabled
              style={{ width: "100%", opacity: 0.65 }}
            />
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => flash(setSavedProfile)}
        >
          {savedProfile ? (
            <>
              <Icon name="check2" size={13} />
              Saved
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </Section>

      <Section title="Organization">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 4 }}>
              Organization name
            </label>
            <input
              className="input"
              defaultValue="My Organization"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 4 }}>
              Plan
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, height: 36 }}>
              <span className="badge badge-ok">Free</span>
              <span className="muted" style={{ fontSize: 13 }}>
                5 agents · 100 validations/mo
              </span>
            </div>
          </div>
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 4 }}>
              Registry slug
            </label>
            <input
              className="input"
              defaultValue="my-org"
              style={{ width: "100%", fontFamily: "var(--font-mono, monospace)" }}
            />
          </div>
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 4 }}>
              Public URL
            </label>
            <input
              className="input"
              defaultValue="pier.dev/registry/my-org"
              disabled
              style={{ width: "100%", opacity: 0.65, fontFamily: "var(--font-mono, monospace)", fontSize: 13 }}
            />
          </div>
        </div>
        <button
          className="btn btn-sm"
          onClick={() => flash(setSavedOrg)}
        >
          {savedOrg ? (
            <>
              <Icon name="check2" size={13} />
              Saved
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </Section>

      <Section title="Notifications">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ToggleRow
            label="Email notifications"
            description="Receive emails for validation results, approvals, and admin actions."
            defaultChecked
          />
          <ToggleRow
            label="Auto-validate on endpoint change"
            description="Trigger a new validation run whenever an endpoint URL is updated."
            defaultChecked
          />
          <ToggleRow
            label="Weekly digest"
            description="Get a weekly summary of registry activity and agent health scores."
          />
          <ToggleRow
            label="Public profile"
            description="Show your organization name in agent card provider information."
          />
        </div>
      </Section>

      <Section title="Validation defaults">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 4 }}>
              Endpoint fetch timeout (seconds)
            </label>
            <input
              className="input"
              type="number"
              defaultValue={10}
              min={1}
              max={60}
              style={{ width: 120 }}
            />
          </div>
          <div>
            <label className="tiny" style={{ display: "block", marginBottom: 4 }}>
              MCP probe timeout (seconds)
            </label>
            <input
              className="input"
              type="number"
              defaultValue={5}
              min={1}
              max={30}
              style={{ width: 120 }}
            />
          </div>
        </div>
      </Section>

      <div
        className="card section"
        style={{ border: "1px solid color-mix(in srgb, var(--err) 40%, transparent)" }}
      >
        <h3 style={{ margin: "0 0 6px", fontSize: 15, color: "var(--err)" }}>
          Danger zone
        </h3>
        <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          These actions are permanent and cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-sm btn-danger">
            <Icon name="trash" size={13} />
            Delete all agents
          </button>
          <button className="btn btn-sm btn-danger">
            <Icon name="building" size={13} />
            Delete organization
          </button>
        </div>
      </div>
    </div>
  );
}
