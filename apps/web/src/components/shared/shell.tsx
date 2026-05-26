"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

function PierMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17h18" />
        <path d="M3 13h18" />
        <path d="M6 21V13" />
        <path d="M18 21V13" />
        <path d="M10 13V7l2-3 2 3v6" />
      </g>
      <circle cx="12" cy="5" r="1.4" fill="var(--signal)" />
    </svg>
  );
}

function TopBar() {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(" ").map((n) => n[0]).join("") ?? "?";
  return (
    <header className="topbar">
      <div className="topbar-left">
        <Link href="/" className="brand">
          <PierMark size={20} />
          <span className="brand-word">Pier</span>
          <span className="brand-tag">/ a2a</span>
        </Link>
        <span className="vr" style={{ height: 18, margin: "0 4px" }}></span>
        <button className="org">
          <div className="org-mark">{initials.slice(0, 2).toUpperCase()}</div>
          <span>{user?.email ? user.email.split("@")[1] : "Pier"}</span>
          <span className="badge badge-sm" style={{ marginLeft: 4 }}>Team</span>
          <Icon name="chevronDown" size={14} />
        </button>
      </div>

      <div className="topbar-center">
        <div className="cmdk">
          <Icon name="search" size={14} />
          <span className="muted">Search registry, skills, providers…</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <kbd>⌘</kbd><kbd>K</kbd>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <Link href="/activity" className="btn btn-ghost btn-sm" title="Activity">
          <Icon name="activity" size={15} />
        </Link>
        <button className="btn btn-ghost btn-sm" title="Docs">
          <Icon name="fileText" size={15} />
        </button>
        <button className="btn btn-ghost btn-sm" title="Notifications" style={{ position: "relative" }}>
          <Icon name="bell" size={15} />
          <span style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "var(--signal)" }}></span>
        </button>
        <Link href="/builder" className="btn btn-primary btn-sm">
          <Icon name="plus" size={14} />
          Register agent
        </Link>
        {user ? (
          <button className="avatar" title={user.email} onClick={logout}>
            <span>{initials}</span>
          </button>
        ) : (
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
        )}
      </div>
    </header>
  );
}

function SideNav() {
  const pathname = usePathname();
  const [agentCount, setAgentCount] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    api.discoverAgents().then((res) => setAgentCount(res.agents.length)).catch(() => {});
    api.discoverAgents().then((res) => {
      const t = new Set<string>();
      res.agents.forEach((a) => (a.tags ?? []).forEach((tag) => t.add(tag)));
      setTags([...t].slice(0, 6));
    }).catch(() => {});
  }, []);

  const items = [
    { href: "/", label: "Registry", icon: "cube", matchExact: true },
    { href: "/builder", label: "Builder", icon: "beaker" },
    { href: "/console", label: "Test console", icon: "terminal" },
    { href: "/activity", label: "Activity", icon: "activity" },
    { href: "/approvals", label: "Approvals", icon: "flag" },
  ];

  const settings = [
    { href: "/keys", label: "API keys", icon: "key" },
    { href: "/settings", label: "Settings", icon: "cog" },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="sidenav">
      <nav className="sidenav-section">
        <div className="tiny" style={{ padding: "0 10px 6px" }}>Workspace</div>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={"sidenav-item" + (isActive(it.href, it.matchExact) ? " active" : "")}
          >
            <Icon name={it.icon} size={15} />
            <span>{it.label}</span>
          </Link>
        ))}
      </nav>

      <div className="hr" style={{ margin: "12px 8px" }}></div>

      {tags.length > 0 && (
        <nav className="sidenav-section">
          <div className="tiny" style={{ padding: "0 10px 6px" }}>Tags</div>
          {tags.map((c) => (
            <Link
              key={c}
              href={`/?category=${encodeURIComponent(c)}`}
              className="sidenav-item small"
            >
              <span className="cat-dot"></span>
              <span>{c}</span>
            </Link>
          ))}
        </nav>
      )}

      <div style={{ flex: 1 }}></div>

      <nav className="sidenav-section">
        {settings.map((it) => (
          <Link key={it.href} href={it.href} className="sidenav-item small muted">
            <Icon name={it.icon} size={14} />
            <span>{it.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidenav-foot">
        <div className="live-dot"></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Registry healthy</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>{agentCount} agents</div>
        </div>
      </div>
    </aside>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <div className="app-body">
        <SideNav />
        <main className="content">
          {children}
        </main>
      </div>
    </>
  );
}
