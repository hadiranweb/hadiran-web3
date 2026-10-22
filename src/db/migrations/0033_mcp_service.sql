-- سرویس MCP: رجیستری سرورها، ابزارها/منابع/پرامپت‌های هر سرور، بستن‌های مصرف‌کننده و حسابرسی فراخوانی.
-- لایهٔ کنترل از لایهٔ مصرف (mcp_configs = مصرف‌کنندهٔ چت) جداست. همه‌چیز افزودنی و Fail-soft است.

CREATE TABLE IF NOT EXISTS mcp_servers (
  slug varchar(64) PRIMARY KEY,
  name varchar(128) NOT NULL,
  title_fa varchar(256),
  description_fa text,
  kind varchar(16) NOT NULL DEFAULT 'builtin',
  transport varchar(24) NOT NULL DEFAULT 'inprocess',
  base_url text,
  protocol_version varchar(16) NOT NULL DEFAULT '2025-11-25',
  instructions_fa text,
  visibility varchar(16) NOT NULL DEFAULT 'internal',
  status varchar(16) NOT NULL DEFAULT 'draft',
  capabilities jsonb NOT NULL DEFAULT '{"tools":true,"resources":true,"prompts":true}'::jsonb,
  auth_type varchar(16) NOT NULL DEFAULT 'none',
  auth_token_cipher text,
  auth_token_hint varchar(8),
  health_status varchar(16),
  health_error text,
  health_at timestamptz,
  created_by integer REFERENCES accounts(id) ON DELETE SET NULL,
  updated_by integer REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mcp_tools (
  id serial PRIMARY KEY,
  server_slug varchar(64) NOT NULL REFERENCES mcp_servers(slug) ON DELETE CASCADE,
  name varchar(128) NOT NULL,
  title_fa varchar(256),
  description_fa text,
  enabled boolean NOT NULL DEFAULT true,
  origin varchar(16) NOT NULL DEFAULT 'code',
  input_schema jsonb NOT NULL DEFAULT '{"type":"object","additionalProperties":false}'::jsonb,
  output_schema jsonb,
  defaults jsonb NOT NULL DEFAULT '{}'::jsonb,
  caps jsonb NOT NULL DEFAULT '{}'::jsonb,
  annotations jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_level varchar(16) NOT NULL DEFAULT 'medium',
  review_status varchar(16) NOT NULL DEFAULT 'unreviewed',
  requires_confirmation boolean NOT NULL DEFAULT false,
  timeout_ms integer NOT NULL DEFAULT 8000,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mcp_tools_server_name_uq UNIQUE (server_slug, name)
);

CREATE TABLE IF NOT EXISTS mcp_resources (
  id serial PRIMARY KEY,
  server_slug varchar(64) NOT NULL REFERENCES mcp_servers(slug) ON DELETE CASCADE,
  uri_template varchar(256) NOT NULL,
  name_fa varchar(256),
  description_fa text,
  mime_type varchar(64) NOT NULL DEFAULT 'application/json',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mcp_resources_server_uri_uq UNIQUE (server_slug, uri_template)
);

CREATE TABLE IF NOT EXISTS mcp_prompts (
  id serial PRIMARY KEY,
  server_slug varchar(64) NOT NULL REFERENCES mcp_servers(slug) ON DELETE CASCADE,
  name varchar(128) NOT NULL,
  title_fa varchar(256),
  description_fa text,
  template_fa text,
  arguments jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mcp_prompts_server_name_uq UNIQUE (server_slug, name)
);

CREATE TABLE IF NOT EXISTS mcp_bindings (
  consumer varchar(64) PRIMARY KEY,
  label_fa varchar(128) NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  auth_token_cipher text,
  auth_token_hint varchar(8),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mcp_binding_tools (
  consumer varchar(64) NOT NULL REFERENCES mcp_bindings(consumer) ON DELETE CASCADE,
  tool_id integer NOT NULL REFERENCES mcp_tools(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  param_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (consumer, tool_id)
);

CREATE TABLE IF NOT EXISTS mcp_call_logs (
  id bigserial PRIMARY KEY,
  server_slug varchar(64),
  tool_name varchar(128) NOT NULL,
  consumer varchar(64) NOT NULL,
  account_id integer REFERENCES accounts(id) ON DELETE SET NULL,
  ok boolean NOT NULL,
  error text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mcp_call_logs_created_idx ON mcp_call_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS mcp_tools_server_idx ON mcp_tools (server_slug, sort_order);

-- بذر سرورهای داخلی هادیران (رفتار فعلی حفظ می‌شود: فعال و بازبینی‌شده).
INSERT INTO mcp_servers (slug, name, title_fa, description_fa, kind, transport, visibility, status)
VALUES
  ('knowledge', 'hadiran-knowledge', 'باغ دانش', 'جست‌وجوی دانش عمومی تاییدشده و لایه‌های مقاله', 'builtin', 'inprocess', 'external', 'active'),
  ('ecosystem', 'hadiran-ecosystem', 'خانه و اکوسیستم', 'پروژه‌های کارگاه، دوره‌ها، آینه‌های باز و گراف موضوع‌ها', 'builtin', 'inprocess', 'external', 'active'),
  ('audience', 'hadiran-audience', 'مخاطب', 'زمینهٔ مخاطب از سشن سرور — فقط داخلی، هرگز بیرونی منتشر نمی‌شود', 'builtin', 'inprocess', 'internal', 'active')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO mcp_tools (server_slug, name, title_fa, description_fa, enabled, origin, input_schema, annotations, risk_level, review_status)
VALUES
  ('knowledge', 'search_knowledge', 'جست‌وجوی دانش', 'جست‌وجو در دانش عمومی تاییدشده همراه لایه‌های مقاله', true, 'code',
   '{"type":"object","properties":{"query":{"type":"string","description":"پرسش یا کلیدواژه"},"topicSlug":{"type":"string"},"limit":{"type":"number","description":"حداکثر نتیجه"}},"required":["query"]}'::jsonb,
   '{"readOnlyHint":true,"openWorldHint":false}'::jsonb, 'low', 'approved'),
  ('ecosystem', 'search_ecosystem', 'جست‌وجوی اکوسیستم', 'پروژه‌های منتشرشده، دوره‌های منتشرشده و آینه‌های باز', true, 'code',
   '{"type":"object","properties":{"query":{"type":"string"},"includeMirrors":{"type":"boolean"}},"required":["query"]}'::jsonb,
   '{"readOnlyHint":true,"openWorldHint":false}'::jsonb, 'low', 'approved'),
  ('ecosystem', 'resolve_topic_graph', 'گراف موضوع', 'موضوع‌های منطبق و قانون اختصاصی هر موضوع', true, 'code',
   '{"type":"object","properties":{"query":{"type":"string"}},"required":["query"]}'::jsonb,
   '{"readOnlyHint":true,"openWorldHint":false}'::jsonb, 'low', 'approved'),
  ('audience', 'get_audience_context', 'زمینهٔ مخاطب', 'فقط داخل چت خانه و از سشن سرور؛ در مسیر بیرونی همیشه مهمان', true, 'code',
   '{"type":"object","properties":{}}'::jsonb,
   '{"readOnlyHint":true,"openWorldHint":false}'::jsonb, 'high', 'approved')
ON CONFLICT (server_slug, name) DO NOTHING;

INSERT INTO mcp_resources (server_slug, uri_template, name_fa, description_fa)
VALUES
  ('ecosystem', 'hadiran://ontology/worlds', 'نقشهٔ اتاق‌های هادیران', 'شش اتاق و مسیرهای واقعی سایت'),
  ('knowledge', 'hadiran://knowledge/{slug}', 'یک نوشتهٔ عمومی', 'متن و لایه‌های ساختاری نوشتهٔ تاییدشده'),
  ('ecosystem', 'hadiran://topics/{slug}', 'یک موضوع و پیوندهای عمومی آن', 'تعریف موضوع و قانون چت خانه')
ON CONFLICT (server_slug, uri_template) DO NOTHING;

INSERT INTO mcp_prompts (server_slug, name, title_fa, description_fa)
VALUES
  ('knowledge', 'local_answer_template', 'قالب پاسخ لوکال', 'قالب دوحالته با متغیرهای topicIntro/knowledgeLine/knowledgeRoot/firstStep/audienceBottleneckHint/closingQuestion'),
  ('knowledge', 'llm_system_prompt', 'پرامپت سیستم LLM', 'لحن هادیران و تکیه فقط بر منابع بازیابی‌شده')
ON CONFLICT (server_slug, name) DO NOTHING;

INSERT INTO mcp_bindings (consumer, label_fa, enabled)
VALUES
  ('home_chat', 'چت خانه', true),
  ('external_api', 'اندپوینت بیرونی /api/mcp', false)
ON CONFLICT (consumer) DO NOTHING;

-- بستن چت خانه: هر چهار ابزار. بستن بیرونی: فقط سرورهای بیرونی (مخاطب هرگز).
INSERT INTO mcp_binding_tools (consumer, tool_id, enabled)
SELECT 'home_chat', id, true FROM mcp_tools
ON CONFLICT (consumer, tool_id) DO NOTHING;

INSERT INTO mcp_binding_tools (consumer, tool_id, enabled)
SELECT 'external_api', t.id, true
FROM mcp_tools t
JOIN mcp_servers s ON s.slug = t.server_slug
WHERE s.visibility = 'external'
ON CONFLICT (consumer, tool_id) DO NOTHING;
