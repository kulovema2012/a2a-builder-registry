// Mock data for Pier — A2A Registry & Builder
// Realistic agent services with full Agent Card metadata.

window.AGENTS = [
  {
    id: 'svc_weatherwise',
    slug: 'weatherwise',
    name: 'WeatherWise',
    icon: '☀',
    description: 'Long-range and hyperlocal weather forecasting with confidence intervals, severe-weather alerts, and historical baselines.',
    provider: { organization: 'Stratosphere Labs', url: 'https://stratosphere.dev' },
    version: '2.4.1',
    documentationUrl: 'https://docs.stratosphere.dev/weatherwise',
    iconUrl: null,
    supportedInterfaces: [
      { url: 'https://api.stratosphere.dev/a2a/weatherwise', protocolBinding: 'JSONRPC', protocolVersion: '0.3', preferred: true },
      { url: 'https://grpc.stratosphere.dev/weatherwise', protocolBinding: 'GRPC', protocolVersion: '0.3' },
    ],
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['application/json', 'text/markdown'],
    capabilities: { streaming: true, pushNotifications: false, extendedAgentCard: true },
    skills: [
      { id: 'forecast.hourly', name: 'Hourly forecast', description: 'Returns next 168 hours of weather for a coordinate or place name, including precipitation probability and confidence.', tags: ['weather','forecast','geospatial'], examples: ['Forecast for 37.77,-122.42 next 24h','Will it rain in Berlin tomorrow afternoon?'] },
      { id: 'forecast.daily', name: 'Daily forecast', description: 'Returns up to 14 days of daily summaries with high/low and dominant conditions.', tags: ['weather','forecast'], examples: ['7-day forecast for Tokyo'] },
      { id: 'alerts.severe', name: 'Severe weather alerts', description: 'Streams active NWS/EU-MET/JMA severe weather alerts for a region.', tags: ['weather','alerts','streaming'], examples: ['Watch alerts for Texas','Tornado warnings active near 32.78,-96.80'] },
      { id: 'history.baseline', name: 'Historical baseline', description: '30-year normal for a given coordinate and day-of-year.', tags: ['weather','history'], examples: ['What is normal rainfall in SF in March?'] },
    ],
    auth: { type: 'apiKey', scheme: 'Header', name: 'X-Stratosphere-Key' },
    tags: ['weather','geo','public-data','realtime'],
    visibility: 'public', status: 'active', validationStatus: 'passed',
    score: 98, lastValidated: '2026-05-24T18:12:00Z',
    uptime: 99.97, calls7d: 142_840,
    owner: 'maya.chen@stratosphere.dev',
    category: 'Data & APIs',
  },
  {
    id: 'svc_marketscout',
    slug: 'marketscout',
    name: 'MarketScout',
    icon: '◈',
    description: 'Equities and crypto research agent. Aggregates filings, earnings transcripts, analyst notes, and on-chain signals into structured briefings.',
    provider: { organization: 'Northwall Research', url: 'https://northwall.io' },
    version: '1.8.0',
    documentationUrl: 'https://docs.northwall.io/marketscout',
    supportedInterfaces: [
      { url: 'https://a2a.northwall.io/marketscout/v1', protocolBinding: 'JSONRPC', protocolVersion: '0.3', preferred: true },
    ],
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['application/json','text/markdown'],
    capabilities: { streaming: true, pushNotifications: true, extendedAgentCard: true },
    skills: [
      { id: 'research.ticker', name: 'Ticker briefing', description: 'Returns a structured briefing for an equity ticker: fundamentals, recent filings, analyst consensus, key risks.', tags: ['finance','research','equities'], examples: ['Brief me on NVDA','Latest on TSLA earnings'] },
      { id: 'research.crypto', name: 'Crypto briefing', description: 'On-chain metrics, social sentiment, and protocol news for a token.', tags: ['finance','crypto','onchain'], examples: ['Status of ETH staking flows'] },
      { id: 'filings.search', name: 'SEC filings search', description: 'Searches SEC EDGAR with semantic queries and returns excerpts.', tags: ['finance','filings'], examples: ['Find risk factor changes in AAPL 10-K'] },
    ],
    auth: { type: 'oauth2', scheme: 'OAuth2', flows: ['authorizationCode'] },
    tags: ['finance','research','equities','crypto'],
    visibility: 'public', status: 'active', validationStatus: 'passed',
    score: 95, lastValidated: '2026-05-25T04:02:00Z',
    uptime: 99.81, calls7d: 88_120,
    owner: 'devops@northwall.io',
    category: 'Research',
  },
  {
    id: 'svc_doccrawler',
    slug: 'doccrawler',
    name: 'DocCrawler',
    icon: '◰',
    description: 'Indexes private document repositories (Drive, Notion, Confluence, S3) and answers questions with citations and source spans.',
    provider: { organization: 'Acme Internal Platform', url: 'https://platform.acme.internal' },
    version: '0.12.3',
    supportedInterfaces: [
      { url: 'https://agents.acme.internal/doccrawler', protocolBinding: 'HTTP+JSON', protocolVersion: '0.3', preferred: true },
    ],
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['application/json','text/markdown'],
    capabilities: { streaming: true, pushNotifications: false, extendedAgentCard: false },
    skills: [
      { id: 'rag.query', name: 'Answer with citations', description: 'Answers a question over the indexed corpus, returning cited spans.', tags: ['rag','search','citations'], examples: ['What is our PTO carryover policy?'] },
      { id: 'rag.search', name: 'Semantic search', description: 'Returns top-k passages without an LLM-generated answer.', tags: ['rag','search'], examples: ['Find docs about EU data residency'] },
    ],
    auth: { type: 'apiKey', scheme: 'Bearer' },
    tags: ['rag','internal','search','enterprise'],
    visibility: 'internal', status: 'active', validationStatus: 'warning',
    score: 81, lastValidated: '2026-05-25T11:47:00Z',
    uptime: 99.22, calls7d: 24_410,
    owner: 'platform@acme.internal',
    category: 'RAG & Search',
  },
  {
    id: 'svc_schedulesage',
    slug: 'schedulesage',
    name: 'ScheduleSage',
    icon: '◐',
    description: 'Calendar-aware scheduling assistant. Resolves availability across timezones, books rooms, and proposes meeting slots with negotiation.',
    provider: { organization: 'Cardinal Workflow', url: 'https://cardinal.work' },
    version: '3.1.2',
    supportedInterfaces: [
      { url: 'https://api.cardinal.work/a2a/schedule', protocolBinding: 'JSONRPC', protocolVersion: '0.3', preferred: true },
    ],
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['application/json'],
    capabilities: { streaming: false, pushNotifications: true, extendedAgentCard: true },
    skills: [
      { id: 'schedule.find', name: 'Find a time', description: 'Resolves a meeting time given participants, duration, and constraints.', tags: ['calendar','scheduling'], examples: ['30-min slot with maya@ and alex@ next week'] },
      { id: 'schedule.negotiate', name: 'Negotiate meeting', description: 'Negotiates with peer agents to propose mutually-acceptable times.', tags: ['calendar','agent-to-agent'], examples: ['Find a time with peer agent of beta@vendor.com'] },
    ],
    auth: { type: 'oauth2', scheme: 'OAuth2' },
    tags: ['calendar','scheduling','workflow','a2a'],
    visibility: 'public', status: 'active', validationStatus: 'passed',
    score: 94, lastValidated: '2026-05-25T13:18:00Z',
    uptime: 99.94, calls7d: 312_500,
    owner: 'agents@cardinal.work',
    category: 'Productivity',
  },
  {
    id: 'svc_translatebridge',
    slug: 'translatebridge',
    name: 'TranslateBridge',
    icon: '⌘',
    description: 'Multilingual translation agent supporting 119 languages with glossary control, tone preservation, and domain adaptation.',
    provider: { organization: 'Polyglot Systems', url: 'https://polyglot.systems' },
    version: '4.0.0',
    supportedInterfaces: [
      { url: 'https://a2a.polyglot.systems/translate', protocolBinding: 'JSONRPC', protocolVersion: '0.3', preferred: true },
      { url: 'https://a2a.polyglot.systems/translate/grpc', protocolBinding: 'GRPC', protocolVersion: '0.3' },
    ],
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain','application/json'],
    capabilities: { streaming: true, pushNotifications: false, extendedAgentCard: false },
    skills: [
      { id: 'translate.text', name: 'Translate text', description: 'Translates between any supported language pair with tone and formality control.', tags: ['translation','nlp'], examples: ['EN→JA formal: "We appreciate your patience."'] },
      { id: 'detect.language', name: 'Detect language', description: 'Identifies the language and script of a text sample.', tags: ['translation','nlp'], examples: ['Detect: "Saluton, kiel vi fartas?"'] },
    ],
    auth: { type: 'apiKey', scheme: 'Header', name: 'Authorization' },
    tags: ['translation','nlp','multilingual'],
    visibility: 'public', status: 'active', validationStatus: 'passed',
    score: 97, lastValidated: '2026-05-25T09:30:00Z',
    uptime: 99.99, calls7d: 1_204_000,
    owner: 'agents@polyglot.systems',
    category: 'NLP',
  },
  {
    id: 'svc_invoiceparse',
    slug: 'invoiceparse',
    name: 'InvoiceParse',
    icon: '▤',
    description: 'OCR-backed invoice & receipt extraction. Returns structured line items, totals, tax breakdowns, and vendor mapping.',
    provider: { organization: 'Ledgerline AI', url: 'https://ledgerline.ai' },
    version: '1.2.0',
    supportedInterfaces: [
      { url: 'https://a2a.ledgerline.ai/invoice', protocolBinding: 'HTTP+JSON', protocolVersion: '0.3', preferred: true },
    ],
    defaultInputModes: ['application/pdf','image/png','image/jpeg'],
    defaultOutputModes: ['application/json'],
    capabilities: { streaming: false, pushNotifications: false, extendedAgentCard: false },
    skills: [
      { id: 'extract.invoice', name: 'Extract invoice', description: 'Extracts header, line items, totals, tax from a single invoice document.', tags: ['ocr','finance','extraction'], examples: ['Parse this PDF invoice'] },
      { id: 'extract.receipt', name: 'Extract receipt', description: 'Extracts merchant, items, totals from a photo receipt.', tags: ['ocr','expense'], examples: ['Parse this receipt photo'] },
    ],
    auth: { type: 'apiKey', scheme: 'Bearer' },
    tags: ['ocr','finance','extraction','documents'],
    visibility: 'public', status: 'active', validationStatus: 'passed',
    score: 92, lastValidated: '2026-05-24T22:11:00Z',
    uptime: 99.62, calls7d: 51_300,
    owner: 'team@ledgerline.ai',
    category: 'Document AI',
  },
  {
    id: 'svc_bugtriage',
    slug: 'bugtriage',
    name: 'BugTriage',
    icon: '⊕',
    description: 'Triages incoming GitHub issues — clusters duplicates, assigns severity, suggests owners, and drafts a reproduction plan.',
    provider: { organization: 'Acme Internal Platform', url: 'https://platform.acme.internal' },
    version: '0.4.1',
    supportedInterfaces: [
      { url: 'https://agents.acme.internal/bugtriage', protocolBinding: 'JSONRPC', protocolVersion: '0.3', preferred: true },
    ],
    defaultInputModes: ['text/plain','application/json'],
    defaultOutputModes: ['application/json'],
    capabilities: { streaming: false, pushNotifications: true, extendedAgentCard: false },
    skills: [
      { id: 'triage.issue', name: 'Triage issue', description: 'Returns severity, suggested labels, owner team, and a duplicate cluster.', tags: ['devtools','github','triage'], examples: ['Triage issue #4019'] },
      { id: 'triage.repro', name: 'Suggest reproduction', description: 'Drafts a likely reproduction recipe based on issue body and repo conventions.', tags: ['devtools','testing'], examples: ['Reproduce issue: webhooks dropping on retry'] },
    ],
    auth: { type: 'apiKey', scheme: 'Bearer' },
    tags: ['devtools','github','triage','internal'],
    visibility: 'internal', status: 'draft', validationStatus: 'failed',
    score: 64, lastValidated: '2026-05-25T15:02:00Z',
    uptime: null, calls7d: 0,
    owner: 'devplatform@acme.internal',
    category: 'DevTools',
  },
  {
    id: 'svc_contractread',
    slug: 'contractread',
    name: 'ContractRead',
    icon: '§',
    description: 'Reviews commercial contracts and surfaces unusual terms, deviations from a playbook, and obligations on a timeline.',
    provider: { organization: 'Statute & Co.', url: 'https://statute.law' },
    version: '2.0.1',
    supportedInterfaces: [
      { url: 'https://a2a.statute.law/contractread', protocolBinding: 'JSONRPC', protocolVersion: '0.3', preferred: true },
    ],
    defaultInputModes: ['application/pdf','text/plain'],
    defaultOutputModes: ['application/json','text/markdown'],
    capabilities: { streaming: false, pushNotifications: false, extendedAgentCard: true },
    skills: [
      { id: 'review.contract', name: 'Review contract', description: 'Returns a clause-level review with risk flags and playbook deviations.', tags: ['legal','contracts','review'], examples: ['Review this SaaS MSA'] },
      { id: 'extract.obligations', name: 'Extract obligations', description: 'Lists obligations with party, deadline, and trigger.', tags: ['legal','obligations'], examples: ['What do we owe under this NDA?'] },
    ],
    auth: { type: 'oauth2', scheme: 'OAuth2' },
    tags: ['legal','contracts','review','enterprise'],
    visibility: 'public', status: 'active', validationStatus: 'passed',
    score: 93, lastValidated: '2026-05-25T08:21:00Z',
    uptime: 99.71, calls7d: 18_200,
    owner: 'agents@statute.law',
    category: 'Legal',
  },
  {
    id: 'svc_supportcopilot',
    slug: 'supportcopilot',
    name: 'SupportCopilot',
    icon: '◍',
    description: 'Customer support agent that drafts responses grounded in your help center, runs simple actions, and escalates when needed.',
    provider: { organization: 'Acme Internal Platform', url: 'https://platform.acme.internal' },
    version: '1.5.0',
    supportedInterfaces: [
      { url: 'https://agents.acme.internal/support', protocolBinding: 'JSONRPC', protocolVersion: '0.3', preferred: true },
    ],
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain','application/json'],
    capabilities: { streaming: true, pushNotifications: true, extendedAgentCard: true },
    skills: [
      { id: 'support.draft', name: 'Draft response', description: 'Drafts a customer reply citing help-center sources.', tags: ['support','cx'], examples: ['Reply to: my export is stuck'] },
      { id: 'support.classify', name: 'Classify ticket', description: 'Classifies a ticket into product area and urgency.', tags: ['support','classification'], examples: ['Classify ticket #42119'] },
    ],
    auth: { type: 'apiKey', scheme: 'Bearer' },
    tags: ['support','cx','internal'],
    visibility: 'internal', status: 'active', validationStatus: 'passed',
    score: 89, lastValidated: '2026-05-25T14:00:00Z',
    uptime: 99.45, calls7d: 211_800,
    owner: 'cx-platform@acme.internal',
    category: 'CX',
  },
  {
    id: 'svc_researchsynth',
    slug: 'researchsynth',
    name: 'ResearchSynth',
    icon: '◌',
    description: 'Long-form research synthesis. Crawls, reads, and structures findings across the web and your private corpora into briefings.',
    provider: { organization: 'Tessera Labs', url: 'https://tessera.dev' },
    version: '0.9.2',
    supportedInterfaces: [
      { url: 'https://a2a.tessera.dev/synth', protocolBinding: 'JSONRPC', protocolVersion: '0.3', preferred: true },
    ],
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/markdown','application/json'],
    capabilities: { streaming: true, pushNotifications: false, extendedAgentCard: true },
    skills: [
      { id: 'synth.brief', name: 'Generate briefing', description: 'Generates a multi-source briefing for a research question.', tags: ['research','synthesis','rag'], examples: ['State of small-language-model inference'] },
      { id: 'synth.compare', name: 'Compare entities', description: 'Compares N entities across configurable dimensions.', tags: ['research','comparison'], examples: ['Compare Postgres, Spanner, CockroachDB on consistency'] },
    ],
    auth: { type: 'apiKey', scheme: 'Bearer' },
    tags: ['research','synthesis','rag','beta'],
    visibility: 'public', status: 'beta', validationStatus: 'warning',
    score: 78, lastValidated: '2026-05-25T16:42:00Z',
    uptime: 98.81, calls7d: 7_400,
    owner: 'team@tessera.dev',
    category: 'Research',
  },
  {
    id: 'svc_codereviewer',
    slug: 'codereviewer',
    name: 'CodeReviewer',
    icon: '⌥',
    description: 'Reviews pull requests with style, correctness, and security checks. Returns inline comments and a summary verdict.',
    provider: { organization: 'Lattice Engineering', url: 'https://lattice.eng' },
    version: '2.2.0',
    supportedInterfaces: [
      { url: 'https://a2a.lattice.eng/review', protocolBinding: 'JSONRPC', protocolVersion: '0.3', preferred: true },
    ],
    defaultInputModes: ['text/plain','application/json'],
    defaultOutputModes: ['application/json'],
    capabilities: { streaming: true, pushNotifications: true, extendedAgentCard: true },
    skills: [
      { id: 'review.pr', name: 'Review pull request', description: 'Returns inline comments and a summary for a PR.', tags: ['devtools','review','github'], examples: ['Review PR acme/billing#218'] },
      { id: 'review.diff', name: 'Review diff', description: 'Reviews an arbitrary unified diff.', tags: ['devtools','review'], examples: ['Review this diff for race conditions'] },
    ],
    auth: { type: 'apiKey', scheme: 'Bearer' },
    tags: ['devtools','review','github','security'],
    visibility: 'public', status: 'active', validationStatus: 'passed',
    score: 96, lastValidated: '2026-05-25T17:14:00Z',
    uptime: 99.88, calls7d: 432_700,
    owner: 'agents@lattice.eng',
    category: 'DevTools',
  },
  {
    id: 'svc_pipelinesentinel',
    slug: 'pipelinesentinel',
    name: 'PipelineSentinel',
    icon: '⌃',
    description: 'Monitors CI/CD pipelines. Flags flaky tests, regressions, and bottlenecks. Pushes alerts and recommends bisects.',
    provider: { organization: 'Acme Internal Platform', url: 'https://platform.acme.internal' },
    version: '1.0.0',
    supportedInterfaces: [
      { url: 'https://agents.acme.internal/sentinel', protocolBinding: 'JSONRPC', protocolVersion: '0.3', preferred: true },
    ],
    defaultInputModes: ['application/json'],
    defaultOutputModes: ['application/json'],
    capabilities: { streaming: true, pushNotifications: true, extendedAgentCard: false },
    skills: [
      { id: 'ci.analyze', name: 'Analyze run', description: 'Returns root-cause hypothesis for a failed CI run.', tags: ['ci','devtools'], examples: ['Why did acme/main#9421 fail?'] },
      { id: 'ci.flaky', name: 'Flaky test report', description: 'Returns top flaky tests over a window.', tags: ['ci','tests'], examples: ['Top flakes last 7 days'] },
    ],
    auth: { type: 'apiKey', scheme: 'Bearer' },
    tags: ['ci','devtools','monitoring','internal'],
    visibility: 'internal', status: 'active', validationStatus: 'passed',
    score: 90, lastValidated: '2026-05-25T12:00:00Z',
    uptime: 99.55, calls7d: 64_200,
    owner: 'devplatform@acme.internal',
    category: 'DevTools',
  },
];

// Categories for filter UI
window.CATEGORIES = [
  'Data & APIs', 'Research', 'RAG & Search', 'Productivity',
  'NLP', 'Document AI', 'DevTools', 'Legal', 'CX',
];

// Recent activity events
window.ACTIVITY = [
  { ts: '2026-05-25T17:42:00Z', kind: 'validation.passed', svcId: 'svc_codereviewer', actor: 'system', summary: 'Validation passed — score 96' },
  { ts: '2026-05-25T17:31:00Z', kind: 'version.published', svcId: 'svc_translatebridge', actor: 'maya@polyglot.systems', summary: 'v4.0.0 published to public registry' },
  { ts: '2026-05-25T17:18:00Z', kind: 'service.registered', svcId: 'svc_researchsynth', actor: 'devops@tessera.dev', summary: 'Imported Agent Card from a2a.tessera.dev/synth/.well-known/agent-card.json' },
  { ts: '2026-05-25T16:58:00Z', kind: 'validation.failed', svcId: 'svc_bugtriage', actor: 'system', summary: '2 errors — declared streaming but endpoint returned 405' },
  { ts: '2026-05-25T16:42:00Z', kind: 'approval.requested', svcId: 'svc_marketscout', actor: 'team@northwall.io', summary: 'Requested public listing approval' },
  { ts: '2026-05-25T16:30:00Z', kind: 'service.suspended', svcId: 'svc_doccrawler', actor: 'admin@acme.internal', summary: 'Suspended pending ownership re-verification' },
  { ts: '2026-05-25T16:11:00Z', kind: 'validation.passed', svcId: 'svc_schedulesage', actor: 'system', summary: 'Validation passed — score 94' },
  { ts: '2026-05-25T15:50:00Z', kind: 'skill.added', svcId: 'svc_weatherwise', actor: 'maya.chen@stratosphere.dev', summary: 'Added skill alerts.severe' },
];

// User / org
window.ME = {
  name: 'Maya Chen',
  email: 'maya.chen@stratosphere.dev',
  role: 'admin',
  org: { name: 'Stratosphere Labs', slug: 'stratosphere', plan: 'Team' },
};

// Helpers
window.fmtAgo = function(iso) {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  return d + 'd ago';
};

window.fmtNum = function(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
};
