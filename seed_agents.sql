INSERT INTO organizations (id, name, slug, plan, created_at)
VALUES (
  'aaaaaaaa-0000-4000-a000-000000000001',
  'Pier Demo',
  'pier-demo',
  'enterprise',
  now()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO services (id, organization_id, name, slug, description, provider_name, provider_url, visibility, status, version, tags, created_at, updated_at)
VALUES
  ('bbbbbbbb-0001-4000-b000-000000000001', 'aaaaaaaa-0000-4000-a000-000000000001',
   'Text Summarizer', 'text-summarizer',
   'Condenses long documents, articles, and web pages into concise summaries. Supports multi-lingual input and adjustable summary length.',
   'Pier Demo', 'https://pier.dev', 'public', 'active', '1.2.0',
   ARRAY['nlp','summarization','text'], now(), now()),
  ('bbbbbbbb-0002-4000-b000-000000000001', 'aaaaaaaa-0000-4000-a000-000000000001',
   'Code Reviewer', 'code-reviewer',
   'Automated code reviews for Python, TypeScript, Rust, and Go. Detects bugs, security issues, and suggests idiomatic improvements.',
   'Pier Demo', 'https://pier.dev', 'public', 'active', '2.0.1',
   ARRAY['code','security','devtools'], now(), now()),
  ('bbbbbbbb-0003-4000-b000-000000000001', 'aaaaaaaa-0000-4000-a000-000000000001',
   'Data Extractor', 'data-extractor',
   'Extracts structured data (tables, entities, key-value pairs) from unstructured text, PDFs, and HTML. Returns clean JSON.',
   'Pier Demo', 'https://pier.dev', 'public', 'active', '1.0.4',
   ARRAY['data','extraction','nlp','json'], now(), now()),
  ('bbbbbbbb-0004-4000-b000-000000000001', 'aaaaaaaa-0000-4000-a000-000000000001',
   'Meeting Assistant', 'meeting-assistant',
   'Transcribes, summarizes, and extracts action items from meeting recordings and transcripts. Integrates with calendar systems.',
   'Pier Demo', 'https://pier.dev', 'public', 'active', '3.1.0',
   ARRAY['meetings','productivity','nlp','summarization'], now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO service_endpoints (id, service_id, agent_card_url, base_url, protocol_binding, protocol_version, is_preferred, created_at)
VALUES
  ('dddddddd-0001-4000-d000-000000000001', 'bbbbbbbb-0001-4000-b000-000000000001',
   'https://agents.cocotech.cloud/text-summarizer/.well-known/agent-card.json',
   'https://agents.cocotech.cloud/text-summarizer/a2a', 'JSONRPC', '0.2', true, now()),
  ('dddddddd-0002-4000-d000-000000000001', 'bbbbbbbb-0002-4000-b000-000000000001',
   'https://agents.cocotech.cloud/code-reviewer/.well-known/agent-card.json',
   'https://agents.cocotech.cloud/code-reviewer/a2a', 'JSONRPC', '0.2', true, now()),
  ('dddddddd-0003-4000-d000-000000000001', 'bbbbbbbb-0003-4000-b000-000000000001',
   'https://agents.cocotech.cloud/data-extractor/.well-known/agent-card.json',
   'https://agents.cocotech.cloud/data-extractor/a2a', 'JSONRPC', '0.2', true, now()),
  ('dddddddd-0004-4000-d000-000000000001', 'bbbbbbbb-0004-4000-b000-000000000001',
   'https://agents.cocotech.cloud/meeting-assistant/.well-known/agent-card.json',
   'https://agents.cocotech.cloud/meeting-assistant/a2a', 'JSONRPC', '0.2', true, now())
ON CONFLICT DO NOTHING;

INSERT INTO skills (id, service_id, external_skill_id, name, description, tags, input_modes, output_modes, created_at)
VALUES
  ('cccccccc-0001-4000-c000-000000000001', 'bbbbbbbb-0001-4000-b000-000000000001', 'summarize',
   'Summarize text', 'Produces a bullet-point or paragraph summary of the provided text.',
   ARRAY['nlp','text'], ARRAY['text/plain','text/markdown'], ARRAY['text/plain','text/markdown'], now()),
  ('cccccccc-0001-4000-c000-000000000002', 'bbbbbbbb-0001-4000-b000-000000000001', 'summarize_url',
   'Summarize URL', 'Fetches and summarizes a web page given its URL.',
   ARRAY['web','text'], ARRAY['text/plain'], ARRAY['text/plain','text/markdown'], now()),
  ('cccccccc-0002-4000-c000-000000000001', 'bbbbbbbb-0002-4000-b000-000000000001', 'review_code',
   'Review code', 'Analyzes code and returns structured findings with severity levels.',
   ARRAY['code','security'], ARRAY['text/plain','text/x-python','text/x-typescript'], ARRAY['text/plain','application/json'], now()),
  ('cccccccc-0002-4000-c000-000000000002', 'bbbbbbbb-0002-4000-b000-000000000001', 'explain_code',
   'Explain code', 'Produces a plain-English explanation of a code block.',
   ARRAY['code'], ARRAY['text/plain'], ARRAY['text/plain','text/markdown'], now()),
  ('cccccccc-0003-4000-c000-000000000001', 'bbbbbbbb-0003-4000-b000-000000000001', 'extract_entities',
   'Extract entities', 'Identifies named entities (people, organizations, dates, amounts) from text.',
   ARRAY['nlp','data'], ARRAY['text/plain','text/html'], ARRAY['application/json'], now()),
  ('cccccccc-0003-4000-c000-000000000002', 'bbbbbbbb-0003-4000-b000-000000000001', 'extract_table',
   'Extract table', 'Parses tabular data from HTML or markdown into a JSON array of rows.',
   ARRAY['data','parsing'], ARRAY['text/plain','text/html','text/markdown'], ARRAY['application/json','text/csv'], now()),
  ('cccccccc-0004-4000-c000-000000000001', 'bbbbbbbb-0004-4000-b000-000000000001', 'summarize_meeting',
   'Summarize meeting', 'Generates a structured meeting summary with key decisions and topics covered.',
   ARRAY['meetings','nlp'], ARRAY['text/plain'], ARRAY['text/markdown','application/json'], now()),
  ('cccccccc-0004-4000-c000-000000000002', 'bbbbbbbb-0004-4000-b000-000000000001', 'extract_action_items',
   'Extract action items', 'Identifies action items, owners, and deadlines from a transcript.',
   ARRAY['meetings','productivity'], ARRAY['text/plain'], ARRAY['application/json','text/markdown'], now())
ON CONFLICT DO NOTHING;

SELECT name, slug, visibility, status, version, tags FROM services WHERE organization_id = 'aaaaaaaa-0000-4000-a000-000000000001';
