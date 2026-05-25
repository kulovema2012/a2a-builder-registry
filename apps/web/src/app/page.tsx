"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, type Service } from "@/lib/api";
import { Card, Button, StatusBadge } from "@/components/shared/ui";

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listServices({ page_size: "5" })
      .then((data) => setServices(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage your A2A agent services</p>
        </div>
        <div className="flex gap-3">
          <Link href="/builder">
            <Button>Create Service</Button>
          </Link>
          <Link href="/services/import">
            <Button variant="secondary">Import Agent Card</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Services", value: services.length.toString(), icon: "Box" },
          { label: "Published", value: services.filter(s => s.visibility === "public").length.toString(), icon: "Globe" },
          { label: "Draft", value: services.filter(s => s.visibility === "draft").length.toString(), icon: "Edit" },
          { label: "Pending Review", value: services.filter(s => s.status === "pending_review").length.toString(), icon: "Clock" },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                <span className="text-[var(--accent)] text-lg">
                  {stat.icon === "Box" ? "📦" : stat.icon === "Globe" ? "🌐" : stat.icon === "Edit" ? "✏️" : "⏳"}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Services</h2>
          <Link href="/services" className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)]">
            View all &rarr;
          </Link>
        </div>
        {loading ? (
          <Card>
            <p className="text-[var(--text-muted)] text-center py-8">Loading services...</p>
          </Card>
        ) : services.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)] text-lg">No services yet</p>
              <p className="text-[var(--text-muted)] text-sm mt-2">
                Create a new service or import an existing Agent Card to get started.
              </p>
              <div className="mt-4 flex gap-3 justify-center">
                <Link href="/builder"><Button>Create Service</Button></Link>
                <Link href="/services/import"><Button variant="secondary">Import Agent Card</Button></Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {services.map((svc) => (
              <Link key={svc.id} href={`/services/${svc.id}`}>
                <Card className="flex items-center justify-between hover:border-[var(--accent)]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                      {svc.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium">{svc.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{svc.description?.slice(0, 80) || "No description"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={svc.visibility} />
                    <StatusBadge status={svc.status} />
                    <span className="text-xs text-[var(--text-muted)]">v{svc.version}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/registry">
          <Card className="hover:border-[var(--accent)]">
            <h3 className="font-semibold mb-1">Agent Registry</h3>
            <p className="text-sm text-[var(--text-secondary)]">Browse and discover registered A2A agent services</p>
          </Card>
        </Link>
        <Link href="/console">
          <Card className="hover:border-[var(--accent)]">
            <h3 className="font-semibold mb-1">Test Console</h3>
            <p className="text-sm text-[var(--text-secondary)]">Send sample A2A requests and inspect responses</p>
          </Card>
        </Link>
        <Link href="/builder">
          <Card className="hover:border-[var(--accent)]">
            <h3 className="font-semibold mb-1">Agent Card Builder</h3>
            <p className="text-sm text-[var(--text-secondary)]">Guided tool to create A2A-compatible service metadata</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
