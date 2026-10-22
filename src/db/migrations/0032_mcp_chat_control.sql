-- موتور گفتگوی MCP: تنظیمات سراسری دوحالته (لوکال/LLM) و قوانین موضوعی.
-- کلیدها فقط رمزنگاری‌شده (AES-256-GCM در src/lib/bots/secret.ts) نگه داشته می‌شوند؛ متن خام هرگز اینجا نیست.

CREATE TABLE IF NOT EXISTS mcp_configs (
  id varchar(32) PRIMARY KEY DEFAULT 'default',
  mode varchar(16) NOT NULL DEFAULT 'local',
  llm_provider varchar(32) NOT NULL DEFAULT 'openai_compatible',
  llm_base_url text NOT NULL DEFAULT 'https://api.openai.com/v1',
  llm_model varchar(128) NOT NULL DEFAULT 'gpt-4o-mini',
  llm_api_key_cipher text,
  llm_api_key_hint varchar(8),
  llm_temperature double precision NOT NULL DEFAULT 0.3,
  llm_max_tokens integer NOT NULL DEFAULT 700,
  llm_timeout_ms integer NOT NULL DEFAULT 8000,
  audience_context_level varchar(24) NOT NULL DEFAULT 'conversation',
  max_history_turns integer NOT NULL DEFAULT 4,
  enable_knowledge_tool boolean NOT NULL DEFAULT true,
  enable_article_layers boolean NOT NULL DEFAULT true,
  enable_projects_tool boolean NOT NULL DEFAULT true,
  enable_courses_tool boolean NOT NULL DEFAULT true,
  enable_analyzers_tool boolean NOT NULL DEFAULT true,
  enable_external_mcp_endpoint boolean NOT NULL DEFAULT false,
  external_mcp_token_cipher text,
  external_mcp_token_hint varchar(8),
  weights jsonb NOT NULL DEFAULT '{"title":3,"summary":2,"body":1,"topic":4,"hopBonus":8}'::jsonb,
  default_system_prompt_fa text,
  default_local_template_fa text,
  last_llm_status varchar(32),
  last_llm_error text,
  last_llm_at timestamptz,
  updated_by integer REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mcp_topic_rules (
  id serial PRIMARY KEY,
  topic_slug varchar(64) NOT NULL UNIQUE REFERENCES topics(slug) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  mode_override varchar(16) NOT NULL DEFAULT 'inherit',
  response_style varchar(32) NOT NULL DEFAULT 'clarify_first',
  custom_prompt_fa text,
  custom_local_lead_fa text,
  closing_question_override_fa text,
  preferred_analyzer_slug varchar(64),
  priority_boost integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
