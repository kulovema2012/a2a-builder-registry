"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, type Service } from "@/lib/api";
import { Icon } from "@/components/shared/icon";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.q = search;
    api.listServices(Object.keys(params).length ? params : undefined)
      .then((res) => setServices(res.services ?? []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="registry">
      <div className="registry-head">
        <div className="registry-title">
          <h1>Services</h1>
          <span className="tiny">{loading ? "Loading…" : `${services.length} services`}</span>
        </div>
        <div className="registry-actions">
          <Link href="/builder" className="btn btn-primary btn-sm">
            <Icon name="plus" size={14} />Create service
          </Link>
          <Link href="/services/import" className="btn btn-sm">
            <Icon name="upload" size={14} />Import
          </Link>
        </div>
      </div>

      <div className="registry-toolbar">
        <div className="search">
          <Icon name="search" size={14} />
          <input className="search-input" placeholder="Search by name, slug, provider…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="btn-ghost btn btn-icon btn-sm" onClick={() => setSearch("")}><Icon name="x" size={12} /></button>}
        </div>
      </div>

      {loading ? (
        <div className="empty">
          <Icon name="activity" size={28} className="muted" />
          <h3>Loading services…</h3>
        </div>
      ) : services.length === 0 ? (
        <div className="empty">
          <Icon name="cube" size={28} className="muted" />
          <h3>No services found</h3>
          <p className="muted">Create your first service or import an Agent Card.</p>
        </div>
      ) : (
        <div className="list">
          <div className="list-head">
            <div>Service</div>
            <div>Description</div>
            <div>Status</div>
            <div></div>
          </div>
          {services.map((svc) => (
            <Link key={svc.id} href={`/services/${svc.id}`} className="agent-row" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="agent-row-name">
                <div className="agent-mark" style={{ width: 28, height: 28, fontSize: 14, background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--text-2)" }}>
                  {svc.name[0]}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 500 }}>{svc.name}</span>
                    {svc.version && <span className="muted mono" style={{ fontSize: 11 }}>v{svc.version}</span>}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>{svc.provider_name ?? "Unknown"}</div>
                </div>
              </div>
              <div className="agent-row-desc">{svc.description ?? "No description"}</div>
              <div className="agent-row-meta">
                <span className="badge badge-sm">{svc.visibility}</span>
                <span className={"badge badge-sm " + (svc.status === "active" ? "badge-ok" : "")}>{svc.status}</span>
              </div>
              <Icon name="chevronRight" size={14} className="muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
