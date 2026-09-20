import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Enums ----------

export const knowledgeTypeEnum = pgEnum("knowledge_type", [
  "wiki",
  "article",
  "note",
  "research",
  "idea",
]);

export const courseTypeEnum = pgEnum("course_type", ["free", "paid"]);

export const projectStatusEnum = pgEnum("project_status", [
  "idea",
  "concept",
  "research",
  "prototype",
  "development",
  "beta",
  "production",
  "archived",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "whitepaper",
  "blueprint",
  "roadmap",
  "gantt",
]);

export const collaborationStatusEnum = pgEnum("collaboration_status", [
  "submitted",
  "reviewed",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
]);

export const accountRoleEnum = pgEnum("account_role", ["owner", "member"]);

export const otpPurposeEnum = pgEnum("otp_purpose", ["login"]);

export const authEventOutcomeEnum = pgEnum("auth_event_outcome", [
  "success",
  "failure",
  "blocked",
]);

// ---------- Core Entities ----------

export const person = pgTable("person", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  nameFa: varchar("name_fa", { length: 128 }).notNull(),
  nameEn: varchar("name_en", { length: 128 }),
  avatarUrl: text("avatar_url"),
  introFa: text("intro_fa"),
  storyFa: text("story_fa"),
  pathFa: text("path_fa"),
  perspectiveFa: text("perspective_fa"),
  principlesFa: jsonb("principles_fa").$type<string[]>(),
  contactMethods: jsonb("contact_methods").$type<
    { label: string; value: string; url?: string }[]
  >(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  labelFa: varchar("label_fa", { length: 128 }).notNull(),
  labelEn: varchar("label_en", { length: 128 }),
  descriptionFa: text("description_fa"),
  color: varchar("color", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const knowledge = pgTable("knowledge", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  type: knowledgeTypeEnum("type").notNull(),
  titleFa: varchar("title_fa", { length: 256 }).notNull(),
  titleEn: varchar("title_en", { length: 256 }),
  summaryFa: text("summary_fa"),
  bodyFa: text("body_fa"),
  aiIndexable: boolean("ai_indexable").default(true),
  versionable: boolean("versionable").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const knowledgeSlides = pgTable("knowledge_slides", {
  id: serial("id").primaryKey(),
  knowledgeId: integer("knowledge_id")
    .notNull()
    .references(() => knowledge.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  titleFa: varchar("title_fa", { length: 256 }),
  titleEn: varchar("title_en", { length: 256 }),
  bodyFa: text("body_fa"),
  bodyEn: text("body_en"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  type: courseTypeEnum("type").notNull().default("free"),
  titleFa: varchar("title_fa", { length: 256 }).notNull(),
  titleEn: varchar("title_en", { length: 256 }),
  descriptionFa: text("description_fa"),
  price: integer("price"),
  currency: varchar("currency", { length: 8 }).default("IRR"),
  durationMinutes: integer("duration_minutes"),
  level: varchar("level", { length: 32 }),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 128 }).notNull(),
  titleFa: varchar("title_fa", { length: 256 }).notNull(),
  order: integer("order").notNull().default(0),
  bodyFa: text("body_fa"),
  durationMinutes: integer("duration_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, {
    onDelete: "cascade",
  }),
  knowledgeId: integer("knowledge_id").references(() => knowledge.id, {
    onDelete: "cascade",
  }),
  titleFa: varchar("title_fa", { length: 256 }).notNull(),
  url: text("url"),
  resourceType: varchar("resource_type", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  nameFa: varchar("name_fa", { length: 256 }).notNull(),
  nameEn: varchar("name_en", { length: 256 }),
  descriptionFa: text("description_fa"),
  logoUrl: text("logo_url"),
  category: varchar("category", { length: 64 }),
  status: projectStatusEnum("status").notNull().default("idea"),
  progress: integer("progress").default(0),
  priority: varchar("priority", { length: 32 }),
  lastUpdate: timestamp("last_update", { withTimezone: true }).defaultNow(),
  problemFa: text("problem_fa"),
  visionFa: text("vision_fa"),
  conceptFa: text("concept_fa"),
  objectivesFa: jsonb("objectives_fa").$type<string[]>(),
  externalLinks: jsonb("external_links").$type<
    { label: string; url: string }[]
  >(),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const projectDocuments = pgTable("project_documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull(),
  titleFa: varchar("title_fa", { length: 256 }).notNull(),
  bodyFa: text("body_fa"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  labelFa: varchar("label_fa", { length: 128 }).notNull(),
  labelEn: varchar("label_en", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  labelFa: varchar("label_fa", { length: 128 }).notNull(),
  labelEn: varchar("label_en", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const collaborations = pgTable("collaborations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  roleId: integer("role_id").references(() => roles.id, {
    onDelete: "set null",
  }),
  fullName: varchar("full_name", { length: 128 }).notNull(),
  email: varchar("email", { length: 128 }).notNull(),
  message: text("message"),
  portfolioUrl: text("portfolio_url"),
  skills: jsonb("skills").$type<string[]>(),
  status: collaborationStatusEnum("status").notNull().default("submitted"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  labelFa: varchar("label_fa", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  nameFa: varchar("name_fa", { length: 256 }).notNull(),
  nameEn: varchar("name_en", { length: 256 }),
  descriptionFa: text("description_fa"),
  url: text("url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 16 }).notNull().unique(),
  displayName: varchar("display_name", { length: 128 }),
  role: accountRoleEnum("role").notNull().default("member"),
  isActive: boolean("is_active").notNull().default(true),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const otpChallenges = pgTable("otp_challenges", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 16 }).notNull(),
  purpose: otpPurposeEnum("purpose").notNull().default("login"),
  codeHash: varchar("code_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  providerMessageId: varchar("provider_message_id", { length: 64 }),
  requestId: varchar("request_id", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const authEvents = pgTable("auth_events", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, {
    onDelete: "set null",
  }),
  phone: varchar("phone", { length: 16 }),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  outcome: authEventOutcomeEnum("outcome").notNull(),
  errorCode: varchar("error_code", { length: 64 }),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: varchar("user_agent", { length: 500 }),
  latencyMs: integer("latency_ms"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    bucketKey: varchar("bucket_key", { length: 128 }).notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    windowSeconds: integer("window_seconds").notNull(),
    requestCount: integer("request_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bucketKey, t.windowStart] })]
);

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations").$type<{
    knowledge: { slug: string; title: string; summary?: string | null }[];
    projects: { slug: string; name: string; summary?: string | null }[];
    courses: { slug: string; title: string; summary?: string | null }[];
    topics: { slug: string; name: string; summary?: string | null }[];
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ---------- Relationship / Join Tables ----------

export const knowledgeTopics = pgTable(
  "knowledge_topics",
  {
    knowledgeId: integer("knowledge_id")
      .notNull()
      .references(() => knowledge.id, { onDelete: "cascade" }),
    topicId: integer("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.knowledgeId, t.topicId] })]
);

export const courseTopics = pgTable(
  "course_topics",
  {
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    topicId: integer("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.topicId] })]
);

export const courseSkills = pgTable(
  "course_skills",
  {
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.skillId] })]
);

export const projectTopics = pgTable(
  "project_topics",
  {
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    topicId: integer("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.topicId] })]
);

export const projectSkills = pgTable(
  "project_skills",
  {
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.skillId] })]
);

export const projectRequiredRoles = pgTable(
  "project_required_roles",
  {
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    count: integer("count").default(1),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.roleId] })]
);

export const knowledgeReferences = pgTable(
  "knowledge_references",
  {
    sourceKnowledgeId: integer("source_knowledge_id")
      .notNull()
      .references(() => knowledge.id, { onDelete: "cascade" }),
    targetKnowledgeId: integer("target_knowledge_id")
      .notNull()
      .references(() => knowledge.id, { onDelete: "cascade" }),
    relation: varchar("relation", { length: 32 }).default("references"),
  },
  (t) => [primaryKey({ columns: [t.sourceKnowledgeId, t.targetKnowledgeId] })]
);

export const knowledgeProjects = pgTable(
  "knowledge_projects",
  {
    knowledgeId: integer("knowledge_id")
      .notNull()
      .references(() => knowledge.id, { onDelete: "cascade" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.knowledgeId, t.projectId] })]
);

export const courseProjects = pgTable(
  "course_projects",
  {
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.projectId] })]
);

export const personSkills = pgTable(
  "person_skills",
  {
    personId: integer("person_id")
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.personId, t.skillId] })]
);

export const personTopics = pgTable(
  "person_topics",
  {
    personId: integer("person_id")
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    topicId: integer("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.personId, t.topicId] })]
);

export const personOrganizations = pgTable(
  "person_organizations",
  {
    personId: integer("person_id")
      .notNull()
      .references(() => person.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    roleFa: varchar("role_fa", { length: 128 }),
  },
  (t) => [primaryKey({ columns: [t.personId, t.organizationId] })]
);

// ---------- Relations ----------

export const personRelations = relations(person, ({ many }) => ({
  skills: many(personSkills),
  topics: many(personTopics),
  organizations: many(personOrganizations),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  knowledge: many(knowledgeTopics),
  courses: many(courseTopics),
  projects: many(projectTopics),
  people: many(personTopics),
}));

export const knowledgeRelations = relations(knowledge, ({ many }) => ({
  topics: many(knowledgeTopics),
  slides: many(knowledgeSlides),
  references: many(knowledgeReferences, { relationName: "source" }),
  referencedBy: many(knowledgeReferences, { relationName: "target" }),
  projects: many(knowledgeProjects),
  resources: many(resources),
}));

export const knowledgeSlidesRelations = relations(knowledgeSlides, ({ one }) => ({
  knowledge: one(knowledge, {
    fields: [knowledgeSlides.knowledgeId],
    references: [knowledge.id],
  }),
}));

export const knowledgeTopicsRelations = relations(knowledgeTopics, ({ one }) => ({
  knowledge: one(knowledge, {
    fields: [knowledgeTopics.knowledgeId],
    references: [knowledge.id],
  }),
  topic: one(topics, {
    fields: [knowledgeTopics.topicId],
    references: [topics.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  lessons: many(lessons),
  topics: many(courseTopics),
  skills: many(courseSkills),
  resources: many(resources),
  projects: many(courseProjects),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  topics: many(projectTopics),
  skills: many(projectSkills),
  requiredRoles: many(projectRequiredRoles),
  documents: many(projectDocuments),
  collaborations: many(collaborations),
  knowledge: many(knowledgeProjects),
  courses: many(courseProjects),
}));

export const projectDocumentsRelations = relations(projectDocuments, ({ one }) => ({
  project: one(projects, {
    fields: [projectDocuments.projectId],
    references: [projects.id],
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  courses: many(courseSkills),
  projects: many(projectSkills),
  people: many(personSkills),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  projectRoles: many(projectRequiredRoles),
  collaborations: many(collaborations),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  people: many(personOrganizations),
}));

export const collaborationsRelations = relations(collaborations, ({ one }) => ({
  project: one(projects, {
    fields: [collaborations.projectId],
    references: [projects.id],
  }),
  role: one(roles, {
    fields: [collaborations.roleId],
    references: [roles.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
  sessions: many(sessions),
  authEvents: many(authEvents),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  account: one(accounts, {
    fields: [sessions.accountId],
    references: [accounts.id],
  }),
}));

export const authEventsRelations = relations(authEvents, ({ one }) => ({
  account: one(accounts, {
    fields: [authEvents.accountId],
    references: [accounts.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
