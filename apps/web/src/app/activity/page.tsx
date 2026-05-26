"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/icon";
import { api, type RegistryEvent } from "@/lib/api";
import { fmtAgo } from "@/lib/helpers";

const EVENT_META: Record<string, { icon: string; color: string; label: string }> = {
  "service.created": { icon: "plus", color: "var(--info)", label: "Service created" },
  "validation.passed": { icon: "check2", color: "var(--ok)", label: "Validation passed" },
  "validation.failed": { icon: "alert", color: "var(--err)", label: "Validation failed" },
  "approval.approved": { icon: "check2", color: "var(--ok)", label: "Approved" },
  "approval.rejected": { icon: "x", color: "var(--err)", label: "Rejected" },
  "service.suspended": { icon: "pause", color: "var(--err)", label: "Service suspended" },
};

export default function ActivityPage() {
  const router = useRouter();
  const [events, setEvents] = useState<RegistryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listEvents({ page: String(page) });
      setEvents(res.events);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return (
    <div className="activity-page">
      <div className="activity-head">
        <div>
          <div className="tiny">Activity</div>
          <h1>Registry activity</h1>
          <p className="muted">Validations, approvals, registrations, and admin actions.</p>
        </div>
        <button className="btn btn-sm" onClick={fetchEvents}><Icon name="refresh" size={13} />Refresh</button>
      </div>

      {loading ? (
        <div className="empty" style={{ padding: 40 }}><Icon name="activity" size={28} className="muted" /><h3>Loading events…</h3></div>
      ) : events.length === 0 ? (
        <div className="empty" style={{ padding: 40 }}><Icon name="activity" size={28} className="muted" /><h3>No events yet</h3><p className="muted">Events will appear here as services are registered and validated.</p></div>
      ) : (
        <ul className="activity-list">
          {events.map((ev, i) => {
            const meta = EVENT_META[ev.eventType] || { icon: "info", color: "var(--text-2)", label: ev.eventType };
            return (
              <li key={ev.id} className="activity-item">
                <div className="activity-spine">
                  <div className="activity-icon" style={{ color: meta.color, borderColor: meta.color + "40", background: meta.color + "14" }}>
                    <Icon name={meta.icon} size={13} />
                  </div>
                  {i < events.length - 1 && <div className="activity-line"></div>}
                </div>
                <div
                  className="activity-body card card-hover"
                  onClick={() => ev.serviceId && router.push(`/services/${ev.serviceId}`)}
                  style={{ cursor: ev.serviceId ? "pointer" : "default" }}
                >
                  <div className="activity-row">
                    <span className="mono" style={{ color: meta.color, fontSize: 12 }}>{ev.eventType}</span>
                    <span className="muted" style={{ fontSize: 12, marginLeft: "auto" }}>{fmtAgo(ev.createdAt)}</span>
                  </div>
                  <div className="activity-row" style={{ marginTop: 4 }}>
                    <span style={{ fontWeight: 500 }}>{ev.serviceName ?? "Unknown service"}</span>
                    {ev.serviceSlug && <span className="muted mono" style={{ fontSize: 11 }}>/{ev.serviceSlug}</span>}
                  </div>
                  {ev.metadata != null && (
                    <p style={{ margin: "6px 0 0", color: "var(--text-2)", fontSize: 13 }}>
                      {JSON.stringify(ev.metadata).slice(0, 200)}
                    </p>
                  )}
                  <div className="activity-row" style={{ marginTop: 8 }}>
                    {ev.actorId && <span className="muted mono" style={{ fontSize: 11 }}>actor: {ev.actorId.slice(0, 8)}…</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {events.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "20px 0" }}>
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span className="muted" style={{ lineHeight: "32px" }}>Page {page}</span>
          <button className="btn btn-sm" disabled={events.length < 50} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
