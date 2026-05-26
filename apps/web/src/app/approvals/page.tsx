"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/icon";
import { api } from "@/lib/api";
import { fmtAgo } from "@/lib/helpers";

interface PendingService {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  approvalId: string | null;
  approvalStatus: string | null;
  requestedAt: string | null;
  createdAt: string | null;
}

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

export default function ApprovalsPage() {
  const router = useRouter();
  const [services, setServices] = useState<PendingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listPendingServices({ status: "pending_review" });
      setServices((res.services as PendingService[]) ?? []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = async (serviceId: string, action: "approve" | "reject") => {
    setActionLoading(serviceId);
    try {
      await api.approveService(serviceId, action);
      setServices(s => s.filter(sv => sv.id !== serviceId));
    } catch {}
    setActionLoading(null);
  };

  return (
    <div className="activity-page">
      <div className="activity-head">
        <div>
          <div className="tiny">Approvals</div>
          <h1>Pending review</h1>
          <p className="muted">Services awaiting public listing approval.</p>
        </div>
        <button className="btn btn-sm" onClick={fetchPending}><Icon name="refresh" size={13} />Refresh</button>
      </div>

      <div className="approvals">
        {loading ? (
          <div className="empty" style={{ padding: 40 }}><Icon name="activity" size={28} className="muted" /><h3>Loading…</h3></div>
        ) : services.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}><Icon name="check2" size={28} className="muted" /><h3>All caught up</h3><p className="muted">No services pending review.</p></div>
        ) : (
          services.map((svc) => (
            <div key={svc.id} className="card section approval-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="agent-mark" style={{ width: 36, height: 36, fontSize: 18, background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--text-2)" }}>
                  {svc.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 500, fontSize: 15 }}>{svc.name}</span>
                    <span className="badge badge-sm mono">{svc.slug}</span>
                    {svc.status && <StatusPill s={svc.status} />}
                  </div>
                  <div className="muted mono" style={{ fontSize: 12, marginTop: 2 }}>
                    {svc.requestedAt ? `Requested ${fmtAgo(svc.requestedAt)}` : svc.createdAt ? `Created ${fmtAgo(svc.createdAt)}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => router.push(`/services/${svc.id}`)}>Review</button>
                  <button
                    className="btn btn-sm btn-danger"
                    disabled={actionLoading === svc.id}
                    onClick={() => handleAction(svc.id, "reject")}
                  >
                    <Icon name="x" size={12} />Reject
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={actionLoading === svc.id}
                    onClick={() => handleAction(svc.id, "approve")}
                  >
                    <Icon name="check" size={12} />Approve
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
