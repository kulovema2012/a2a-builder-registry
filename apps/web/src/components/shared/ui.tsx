import React from "react";

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// Badge component
export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "muted";
}) {
  const variants: Record<string, string> = {
    default: "bg-[var(--bg-hover)] text-[var(--text-secondary)]",
    success: "bg-emerald-500/20 text-emerald-400",
    warning: "bg-amber-500/20 text-amber-400",
    error: "bg-red-500/20 text-red-400",
    info: "bg-blue-500/20 text-blue-400",
    muted: "bg-gray-500/20 text-gray-400",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

// Button component
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const variants: Record<string, string> = {
    primary: "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white",
    secondary: "bg-[var(--bg-hover)] hover:bg-[var(--border)] text-[var(--text-primary)]",
    ghost: "hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </button>
  );
}

// Card component
export function Card({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 ${onClick ? "cursor-pointer hover:border-[var(--accent)] transition-colors" : ""} ${className || ""}`}
    >
      {children}
    </div>
  );
}

// Input component
export function Input({
  label,
  error,
  ...props
}: {
  label?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
      <input
        className={`w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors ${error ? "border-red-500" : ""}`}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

// Textarea
export function Textarea({
  label,
  error,
  ...props
}: {
  label?: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors min-h-[100px] ${error ? "border-red-500" : ""}`}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

// Select
export function Select({
  label,
  options,
  error,
  ...props
}: {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
      <select
        className={`w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors ${error ? "border-red-500" : ""}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

// StatusBadge
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "warning" | "error" | "info" | "muted"; label: string }> = {
    active: { variant: "success", label: "Active" },
    suspended: { variant: "error", label: "Suspended" },
    delisted: { variant: "muted", label: "Delisted" },
    pending_review: { variant: "warning", label: "Pending Review" },
    draft: { variant: "muted", label: "Draft" },
    private: { variant: "info", label: "Private" },
    internal: { variant: "info", label: "Internal" },
    public: { variant: "success", label: "Public" },
    passed: { variant: "success", label: "Passed" },
    failed: { variant: "error", label: "Failed" },
    warning: { variant: "warning", label: "Warning" },
  };
  const config = map[status] || { variant: "default" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
