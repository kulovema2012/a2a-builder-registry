"use client";

import { useState, useEffect } from "react";
import { api, type Service } from "@/lib/api";
import { Card, Button, StatusBadge } from "@/components/shared/ui";

export default function AdminPage() {
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
      setPendingServices(pending.items);
      setAllServices(all.items);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadServices(); }, []);

  const handleApprove = async (serviceId: string) => {
    setActionLoading(serviceId);
    try {
      await api.approveService(serviceId, true, "Approved via admin panel");
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
      await api.approveService(serviceId, false, "Rejected via admin panel");
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage service registrations, approvals, and governance</p>
      </div>

      {/* Pending Review */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Pending Review ({pendingServices.length})</h2>
        {loading ? (
          <Card><p className="text-center py-8 text-[var(--text-muted)]">Loading...</p></Card>
        ) : pendingServices.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-[var(--text-muted)]">No services pending review</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingServices.map((svc) => (
              <Card key={svc.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{svc.name}</h3>
                      <StatusBadge status={svc.status} />
                      <span className="text-xs text-[var(--text-muted)]">v{svc.version}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{svc.description?.slice(0, 120) || "No description"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(svc.id)}
                      disabled={actionLoading === svc.id}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(svc.id)}
                      disabled={actionLoading === svc.id}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* All Services */}
      <div>
        <h2 className="text-lg font-semibold mb-4">All Services ({allServices.length})</h2>
        <div className="space-y-2">
          {allServices.map((svc) => (
            <div key={svc.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">{svc.name}</span>
                <StatusBadge status={svc.visibility} />
                <StatusBadge status={svc.status} />
                <span className="text-xs text-[var(--text-muted)]">v{svc.version}</span>
              </div>
              <div className="flex items-center gap-2">
                {svc.status !== "suspended" && (
                  <Button size="sm" variant="ghost" onClick={() => handleSuspend(svc.id)} disabled={actionLoading === svc.id}>
                    Suspend
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
