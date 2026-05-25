"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, type Service, type PaginatedServices } from "@/lib/api";
import { Card, Button, Input, StatusBadge } from "@/components/shared/ui";

export default function ServicesPage() {
  const [data, setData] = useState<PaginatedServices | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("");

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page_size: "20" };
    if (search) params.q = search;
    if (visibility) params.visibility = visibility;
    api.listServices(params)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, visibility]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {data ? `${data.total} registered service${data.total !== 1 ? "s" : ""}` : "Loading..."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/builder"><Button>Create Service</Button></Link>
          <Link href="/services/import"><Button variant="secondary">Import</Button></Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, description, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
        >
          <option value="">All Visibility</option>
          <option value="draft">Draft</option>
          <option value="private">Private</option>
          <option value="internal">Internal</option>
          <option value="public">Public</option>
        </select>
      </div>

      {/* Service List */}
      {loading ? (
        <Card><p className="text-center py-8 text-[var(--text-muted)]">Loading...</p></Card>
      ) : !data?.items.length ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-[var(--text-muted)]">No services found</p>
            <Link href="/builder" className="mt-3 inline-block">
              <Button>Create your first service</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((svc: Service) => (
            <Link key={svc.id} href={`/services/${svc.id}`}>
              <Card className="hover:border-[var(--accent)] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-bold text-lg shrink-0">
                      {svc.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{svc.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">{svc.description || "No description"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {svc.provider_name && (
                          <span className="text-xs text-[var(--text-muted)]">by {svc.provider_name}</span>
                        )}
                        <span className="text-xs text-[var(--text-muted)]">v{svc.version}</span>
                        {svc.tags?.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={svc.visibility} />
                    <StatusBadge status={svc.status} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="ghost" disabled={data.page <= 1}>Previous</Button>
          <span className="px-4 py-2 text-sm text-[var(--text-secondary)]">
            Page {data.page} of {data.total_pages}
          </span>
          <Button variant="ghost" disabled={data.page >= data.total_pages}>Next</Button>
        </div>
      )}
    </div>
  );
}
