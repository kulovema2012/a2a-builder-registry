"use client";

import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildAgentCardJSON(svc: any) {
  return {
    name: svc.name,
    description: svc.description,
    version: svc.version,
    provider: svc.provider,
    documentationUrl: svc.documentationUrl,
    iconUrl: svc.iconUrl ?? undefined,
    supportedInterfaces: (svc.supportedInterfaces as Record<string, unknown>[]).map((i) => ({
      url: i.url,
      protocolBinding: i.protocolBinding,
      protocolVersion: i.protocolVersion,
    })),
    defaultInputModes: svc.defaultInputModes,
    defaultOutputModes: svc.defaultOutputModes,
    capabilities: svc.capabilities,
    securitySchemes: svc.auth
      ? {
          primary:
            (svc.auth as Record<string, unknown>).type === "apiKey"
              ? {
                  type: "apiKey",
                  in: ((svc.auth as Record<string, unknown>).scheme as string || "header").toLowerCase(),
                  name: (svc.auth as Record<string, unknown>).name as string || "X-API-Key",
                }
              : (svc.auth as Record<string, unknown>).type === "oauth2"
                ? {
                    type: "oauth2",
                    flows: {
                      authorizationCode: { authorizationUrl: "…", tokenUrl: "…", scopes: {} },
                    },
                  }
                : { type: (svc.auth as Record<string, unknown>).type },
        }
      : undefined,
    securityRequirements: svc.auth ? [{ primary: [] }] : undefined,
    skills: (svc.skills as Record<string, unknown>[]).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      tags: s.tags,
      examples: s.examples,
      inputModes: s.inputModes,
      outputModes: s.outputModes,
    })),
  };
}

export function stringifyClean(obj: unknown): string {
  return JSON.stringify(obj, (_k, v) => (v === undefined ? undefined : v), 2);
}

interface HighlightedJSONProps {
  obj: unknown;
  style?: React.CSSProperties;
}

export function HighlightedJSON({ obj, style }: HighlightedJSONProps) {
  const raw = typeof obj === "string" ? obj : stringifyClean(obj);

  const tokens = React.useMemo(() => {
    const re =
      /("(?:[^"\\]|\\.)*"\s*:)|("(?:[^"\\]|\\.)*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\],])/g;
    const out: { t: string; v: string }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) {
      if (m.index > last) out.push({ t: "raw", v: raw.slice(last, m.index) });
      if (m[1]) out.push({ t: "key", v: m[1] });
      else if (m[2]) out.push({ t: "str", v: m[2] });
      else if (m[3]) out.push({ t: m[3] === "null" ? "null" : "bool", v: m[3] });
      else if (m[4]) out.push({ t: "num", v: m[4] });
      else if (m[5]) out.push({ t: "punc", v: m[5] });
      last = m.index + m[0].length;
    }
    if (last < raw.length) out.push({ t: "raw", v: raw.slice(last) });
    return out;
  }, [raw]);

  const cls = (t: string) =>
    ({
      key: "json-key",
      str: "json-string",
      num: "json-number",
      bool: "json-bool",
      null: "json-null",
      punc: "json-punc",
    }[t] || "");

  return (
    <pre className="code-block" style={style}>
      {tokens.map((tk, i) =>
        tk.t === "raw" ? tk.v : <span key={i} className={cls(tk.t)}>{tk.v}</span>
      )}
    </pre>
  );
}
