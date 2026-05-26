"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/icon";
import { api, type Service } from "@/lib/api";
import { fmtAgo } from "@/lib/helpers";

function StatusPill({ s }: { s: string }) {
  const m: Record<string, { cls: string; label: string }> = {
    active: { cls: "badge-ok", label: "active" },
    pending_review: { cls: "badge-warn", label: "pending review" },
    draft: { cls: "badge-warn", label: "draft" },
    suspended: { cls: "badge-err", label: "suspended" },
  };
  const info = m[s] || { cls: "", label: s };
  return <span className={"badge badge-sm " + info.cls}><span className="dot"></span>{info.label}</span>;
}

export default function AdminPage() {
  const router = useRouter();
  const [pendingServices, setPendingServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadServices = async () => {
    setLoading(true);
    try {
      const [pending, all] = await Promise.all([
        api.listServices({ status: "pending_review", page_size: "50" }),
        api.listServices({ page_size: "50" }),
      ]);
      setPendingServices(pending.services);
      setAllServices(all.services);
    } catch {
      setPendingServices([]);
      setAllServices([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadServices(); }, []);

  const handleApprove = async (serviceId: string) => {
    setActionLoading(serviceId);
    try {
      await api.approveService(serviceId, "approve", "Approved via admin panel");
      await loadServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (serviceId: string) => {
    setActionLoading(serviceId);
    try {
      await api.approveService(serviceId, "reject", "Rejected via admin panel");
      await loadServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (serviceId: string) => {
    setActionLoading(serviceId);
    try {
      await api.suspendService(serviceId);
      await loadServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <div className="tiny">Admin</div>
        <h1>Admin Panel</h1>
        <p className="muted">Manage service registrations, approvals, and governance.</p>
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Pending Review ({pendingServices.length})</h2>
        {loading ? (
          <div className="empty">
            <Icon name="activity" size={28} className="muted" />
            <h3>Loading…</h3>
          </div>
        ) : pendingServices.length === 0 ? (
          <div className="card section">
            <div className="empty" style={{ padding: 32 }}>
              <Icon name="check2" size={28} className="muted" />
              <h3>All caught up</h3>
              <p className="muted">No services pending review.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingServices.map((svc) => (
              <div key={svc.id} className="card section">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="agent-mark" style={{ width: 36, height: 36, fontSize: 18, background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--text-2)" }}>
                    {svc.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontWeight: 500, fontSize: 15 }}>{svc.name}</span>
                      <span className="badge badge-sm mono">v{svc.version}</span>
                      <StatusPill s={svc.status} />
                    </div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{svc.description?.slice(0, 120) || "No description"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => router.push(`/services/${svc.id}`)}>Review</button>
                    <button className="btn btn-sm btn-danger" disabled={actionLoading === svc.id} onClick={() => handleReject(svc.id)}>
                      <Icon name="x" size={12} />Reject
                    </button>
                    <button className="btn btn-primary btn-sm" disabled={actionLoading === svc.id} onClick={() => handleApprove(svc.id)}>
                      <Icon name="check" size={12} />Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>All Services ({allServices.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {allServices.map((svc) => (
            <div key={svc.id} className="card section" style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{svc.name}</span>
                <StatusPill s={svc.visibility} />
                <StatusPill s={svc.status} />
                <span className="muted mono" style={{ fontSize: 11 }}>v{svc.version}</span>
                <span style={{ marginLeft: "auto" }}>
                  {svc.status !== "suspended" && (
                    <button className="btn btn-ghost btn-sm" disabled={actionLoading === svc.id} onClick={() => handleSuspend(svc.id)}>
                      <Icon name="pause" size={12} />Suspend
                    </button>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
