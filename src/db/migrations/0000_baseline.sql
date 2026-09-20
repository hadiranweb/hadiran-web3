DO $$ BEGIN
  CREATE TYPE knowledge_type AS ENUM ('wiki', 'article', 'note', 'research', 'idea');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE course_type AS ENUM ('free', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM (
    'idea',
    'concept',
    'research',
    'prototype',
    'development',
    'beta',
    'production',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('whitepaper', 'blueprint', 'roadmap', 'gantt');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE collaboration_status AS ENUM (
    'submitted',
    'reviewed',
    'shortlisted',
    'interview',
    'accepted',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS person (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name_fa VARCHAR(128) NOT NULL,
  name_en VARCHAR(128),
  avatar_url TEXT,
  intro_fa TEXT,
  story_fa TEXT,
  path_fa TEXT,
  perspective_fa TEXT,
  principles_fa JSONB,
  contact_methods JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  label_fa VARCHAR(128) NOT NULL,
  label_en VARCHAR(128),
  description_fa TEXT,
  color VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  type knowledge_type NOT NULL,
  title_fa VARCHAR(256) NOT NULL,
  title_en VARCHAR(256),
  summary_fa TEXT,
  body_fa TEXT,
  ai_indexable BOOLEAN DEFAULT TRUE,
  versionable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  type course_type NOT NULL DEFAULT 'free',
  title_fa VARCHAR(256) NOT NULL,
  title_en VARCHAR(256),
  description_fa TEXT,
  price INTEGER,
  currency VARCHAR(8) DEFAULT 'IRR',
  duration_minutes INTEGER,
  level VARCHAR(32),
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug VARCHAR(128) NOT NULL,
  title_fa VARCHAR(256) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  body_fa TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  name_fa VARCHAR(256) NOT NULL,
  name_en VARCHAR(256),
  description_fa TEXT,
  logo_url TEXT,
  category VARCHAR(64),
  status project_status NOT NULL DEFAULT 'idea',
  progress INTEGER DEFAULT 0,
  priority VARCHAR(32),
  last_update TIMESTAMPTZ DEFAULT NOW(),
  problem_fa TEXT,
  vision_fa TEXT,
  concept_fa TEXT,
  objectives_fa JSONB,
  external_links JSONB,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_documents (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  title_fa VARCHAR(256) NOT NULL,
  body_fa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  label_fa VARCHAR(128) NOT NULL,
  label_en VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  label_fa VARCHAR(128) NOT NULL,
  label_en VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collaborations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  full_name VARCHAR(128) NOT NULL,
  email VARCHAR(128) NOT NULL,
  message TEXT,
  portfolio_url TEXT,
  skills JSONB,
  status collaboration_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  label_fa VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  name_fa VARCHAR(256) NOT NULL,
  name_en VARCHAR(256),
  description_fa TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  knowledge_id INTEGER REFERENCES knowledge(id) ON DELETE CASCADE,
  title_fa VARCHAR(256) NOT NULL,
  url TEXT,
  resource_type VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_topics (
  knowledge_id INTEGER NOT NULL REFERENCES knowledge(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_id, topic_id)
);

CREATE TABLE IF NOT EXISTS course_topics (
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, topic_id)
);

CREATE TABLE IF NOT EXISTS course_skills (
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, skill_id)
);

CREATE TABLE IF NOT EXISTS project_topics (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, topic_id)
);

CREATE TABLE IF NOT EXISTS project_skills (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);

CREATE TABLE IF NOT EXISTS project_required_roles (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 1,
  PRIMARY KEY (project_id, role_id)
);

CREATE TABLE IF NOT EXISTS knowledge_references (
  source_knowledge_id INTEGER NOT NULL REFERENCES knowledge(id) ON DELETE CASCADE,
  target_knowledge_id INTEGER NOT NULL REFERENCES knowledge(id) ON DELETE CASCADE,
  relation VARCHAR(32) DEFAULT 'references',
  PRIMARY KEY (source_knowledge_id, target_knowledge_id)
);

CREATE TABLE IF NOT EXISTS knowledge_projects (
  knowledge_id INTEGER NOT NULL REFERENCES knowledge(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (knowledge_id, project_id)
);

CREATE TABLE IF NOT EXISTS course_projects (
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, project_id)
);

CREATE TABLE IF NOT EXISTS person_skills (
  person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, skill_id)
);

CREATE TABLE IF NOT EXISTS person_topics (
  person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, topic_id)
);

CREATE TABLE IF NOT EXISTS person_organizations (
  person_id INTEGER NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_fa VARCHAR(128),
  PRIMARY KEY (person_id, organization_id)
);
