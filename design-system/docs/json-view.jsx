// JSON syntax highlighter + Agent Card builder helper.

function buildAgentCardJSON(svc) {
  return {
    name: svc.name,
    description: svc.description,
    version: svc.version,
    provider: svc.provider,
    documentationUrl: svc.documentationUrl,
    iconUrl: svc.iconUrl ?? undefined,
    supportedInterfaces: svc.supportedInterfaces.map(i => ({
      url: i.url,
      protocolBinding: i.protocolBinding,
      protocolVersion: i.protocolVersion,
    })),
    defaultInputModes: svc.defaultInputModes,
    defaultOutputModes: svc.defaultOutputModes,
    capabilities: svc.capabilities,
    securitySchemes: svc.auth ? {
      primary: svc.auth.type === 'apiKey'
        ? { type: 'apiKey', in: (svc.auth.scheme || 'header').toLowerCase(), name: svc.auth.name || 'X-API-Key' }
        : svc.auth.type === 'oauth2'
        ? { type: 'oauth2', flows: { authorizationCode: { authorizationUrl: '…', tokenUrl: '…', scopes: {} } } }
        : { type: svc.auth.type }
    } : undefined,
    securityRequirements: svc.auth ? [{ primary: [] }] : undefined,
    skills: svc.skills.map(s => ({
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

function stringifyClean(obj) {
  // Drop undefined fields.
  return JSON.stringify(obj, (k, v) => v === undefined ? undefined : v, 2);
}

function HighlightedJSON({ obj, style }) {
  const raw = typeof obj === 'string' ? obj : stringifyClean(obj);
  // Tokenize JSON for syntax coloring.
  const tokens = React.useMemo(() => {
    const re = /("(?:[^"\\]|\\.)*"\s*:)|("(?:[^"\\]|\\.)*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\],])/g;
    const out = [];
    let last = 0; let m;
    while ((m = re.exec(raw)) !== null) {
      if (m.index > last) out.push({ t: 'raw', v: raw.slice(last, m.index) });
      if (m[1]) out.push({ t: 'key', v: m[1] });
      else if (m[2]) out.push({ t: 'str', v: m[2] });
      else if (m[3]) out.push({ t: m[3] === 'null' ? 'null' : 'bool', v: m[3] });
      else if (m[4]) out.push({ t: 'num', v: m[4] });
      else if (m[5]) out.push({ t: 'punc', v: m[5] });
      last = m.index + m[0].length;
    }
    if (last < raw.length) out.push({ t: 'raw', v: raw.slice(last) });
    return out;
  }, [raw]);
  const cls = (t) => ({
    key: 'json-key', str: 'json-string', num: 'json-number',
    bool: 'json-bool', null: 'json-null', punc: 'json-punc'
  }[t] || '');
  return (
    <pre className="code-block" style={style}>
      {tokens.map((tk, i) => tk.t === 'raw' ? tk.v : <span key={i} className={cls(tk.t)}>{tk.v}</span>)}
    </pre>
  );
}

window.buildAgentCardJSON = buildAgentCardJSON;
window.stringifyClean = stringifyClean;
window.HighlightedJSON = HighlightedJSON;
