import {
  pgTable,
  serial,
  integer,
  bigint,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  pgEnum,
  primaryKey,
  unique,
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

export const accountRoleEnum = pgEnum("account_role", ["owner", "author", "member"]);

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
  growth: text("growth"),
  readingMinutes: integer("reading_minutes"),
  lineFa: text("line_fa"),
  questionFa: text("question_fa"),
  rootFa: text("root_fa"),
  firstStepFa: text("first_step_fa"),
  marginNoteFa: text("margin_note_fa"),
  prunedAt: timestamp("pruned_at", { withTimezone: true }),
  audioUrl: text("audio_url"),
  simulator: jsonb("simulator"),
  closingQuestionFa: text("closing_question_fa"),
  closingOptions: jsonb("closing_options"),
  closingPromptFa: text("closing_prompt_fa"),
  aiIndexable: boolean("ai_indexable").default(true),
  versionable: boolean("versionable").default(true),
  revision: integer("revision").notNull().default(1),
  memoryItemId: varchar("memory_item_id", { length: 64 }),
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
  givenName: varchar("given_name", { length: 64 }),
  familyName: varchar("family_name", { length: 64 }),
  email: varchar("email", { length: 254 }).unique(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  telegramUserId: varchar("telegram_user_id", { length: 32 }).unique(),
  telegramLinkedAt: timestamp("telegram_linked_at", { withTimezone: true }),
  role: accountRoleEnum("role").notNull().default("member"),
  isActive: boolean("is_active").notNull().default(true),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  passwordHash: text("password_hash"),
  passwordSetAt: timestamp("password_set_at", { withTimezone: true }),
  policiesAcceptedAt: timestamp("policies_accepted_at", { withTimezone: true }),
  policiesVersion: varchar("policies_version", { length: 64 }),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  referredByAccountId: integer("referred_by_account_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const casioAttempts = pgTable("casio_attempts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  instrumentVersion: varchar("instrument_version", { length: 64 }).notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  answers: jsonb("answers").$type<Record<string, number | string>>().notNull().default({}),
  results: jsonb("results").$type<{
    version: string;
    effective: Record<string, number>;
    scores: Record<string, number | string>;
  }>(),
  status: varchar("status", { length: 16 }).notNull().default("in_progress"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  referrerAccountId: integer("referrer_account_id").references(() => accounts.id, { onDelete: "set null" }),
  discountCode: varchar("discount_code", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** Authored analyzer packs. Questions live inside pack JSON, not as rows. */
export const analyzerPacks = pgTable("analyzer_packs", {
  slug: varchar("slug", { length: 64 }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull().default("draft"),
  pack: jsonb("pack").$type<import("@/lib/analyzers/pack").AnalyzerPack>().notNull(),
  createdBy: integer("created_by").references(() => accounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analyzerAttempts = pgTable("analyzer_attempts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 64 }).notNull(),
  instrumentVersion: varchar("instrument_version", { length: 64 }).notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  answers: jsonb("answers").$type<Record<string, number | string>>().notNull().default({}),
  results: jsonb("results").$type<{
    version: string;
    effective: Record<string, number>;
    scores: Record<string, number | string>;
  }>(),
  status: varchar("status", { length: 16 }).notNull().default("in_progress"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  referrerAccountId: integer("referrer_account_id").references(() => accounts.id, { onDelete: "set null" }),
  discountCode: varchar("discount_code", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const analyzerGrants = pgTable(
  "analyzer_grants",
  {
    slug: varchar("slug", { length: 64 })
      .notNull()
      .references(() => analyzerPacks.slug, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    canEdit: boolean("can_edit").notNull().default(true),
    canReadResponses: boolean("can_read_responses").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.slug, t.accountId] })],
);

/** Named HTML layouts for interpretation documents. System rows: hadiran, casio-ss. */
export const analyzerDocumentTemplates = pgTable("analyzer_document_templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  titleFa: varchar("title_fa", { length: 128 }).notNull(),
  layoutKey: varchar("layout_key", { length: 64 }).notNull(),
  brandNameFa: varchar("brand_name_fa", { length: 128 }).notNull().default("هادیران"),
  chrome: jsonb("chrome").$type<Record<string, unknown>>().notNull().default({}),
  system: boolean("system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Per-account chrome for a shared template. Authors never write the base row. */
export const analyzerDocumentTemplateOverrides = pgTable(
  "analyzer_document_template_overrides",
  {
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    templateId: varchar("template_id", { length: 64 })
      .notNull()
      .references(() => analyzerDocumentTemplates.id, { onDelete: "cascade" }),
    chrome: jsonb("chrome").$type<Record<string, unknown>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.templateId] })],
);

/** One snapshot per submitted attempt. Layers and actions are child tables. */
export const analyzerReports = pgTable(
  "analyzer_reports",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    attemptId: integer("attempt_id").notNull(),
    attemptKind: varchar("attempt_kind", { length: 16 }).notNull(),
    templateId: varchar("template_id", { length: 64 })
      .notNull()
      .references(() => analyzerDocumentTemplates.id),
    schemaVersion: varchar("schema_version", { length: 16 }).notNull().default("1.0"),
    instrumentVersion: varchar("instrument_version", { length: 64 }).notNull().default(""),
    coverTitle: varchar("cover_title", { length: 256 }).notNull(),
    totalScore: doublePrecision("total_score"),
    totalScoreMax: doublePrecision("total_score_max"),
    maturityLabel: varchar("maturity_label", { length: 128 }),
    bottleneckId: varchar("bottleneck_id", { length: 64 }),
    bottleneckName: varchar("bottleneck_name", { length: 256 }),
    bottleneckScore: doublePrecision("bottleneck_score"),
    personNameSnapshot: varchar("person_name_snapshot", { length: 256 }),
    businessNameSnapshot: varchar("business_name_snapshot", { length: 256 }),
    reportDate: timestamp("report_date", { withTimezone: true }),
    closingFa: text("closing_fa"),
    context: jsonb("context").$type<{ labelFa: string; valueFa: string }[]>().notNull().default([]),
    patterns: jsonb("patterns").$type<{ meaningFa: string; actionFa: string }[]>().notNull().default([]),
    chromeSnapshot: jsonb("chrome_snapshot").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("analyzer_reports_attempt_unique").on(t.attemptKind, t.attemptId)],
);

export const analyzerReportLayers = pgTable("analyzer_report_layers", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id")
    .notNull()
    .references(() => analyzerReports.id, { onDelete: "cascade" }),
  layerId: varchar("layer_id", { length: 64 }).notNull(),
  layerName: varchar("layer_name", { length: 256 }).notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  score: doublePrecision("score"),
  scoreMax: doublePrecision("score_max"),
  status: varchar("status", { length: 128 }),
  constructFa: text("construct_fa"),
  asIsText: text("as_is_text"),
  toBeText: text("to_be_text"),
  isBottleneck: boolean("is_bottleneck").notNull().default(false),
  keywords: jsonb("keywords")
    .$type<{ id: string; titleFa: string; children: { id: string; titleFa: string }[] }[]>()
    .notNull()
    .default([]),
});

export const analyzerReportActions = pgTable("analyzer_report_actions", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id")
    .notNull()
    .references(() => analyzerReports.id, { onDelete: "cascade" }),
  layerId: varchar("layer_id", { length: 64 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  actionTitle: text("action_title").notNull(),
});

/** Owner-connected bots. Telegram first. Not a login channel. */
export const bots = pgTable("bots", {
  id: varchar("id", { length: 32 }).primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 16 }).notNull().default("telegram"),
  titleFa: varchar("title_fa", { length: 128 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("disconnected"),
  service: varchar("service", { length: 32 }).notNull().default("analyzers"),
  analyzerSlug: varchar("analyzer_slug", { length: 64 }),
  script: jsonb("script").$type<Record<string, unknown>>(),
  telegramBotId: varchar("telegram_bot_id", { length: 32 }),
  telegramUsername: varchar("telegram_username", { length: 64 }),
  telegramFirstName: varchar("telegram_first_name", { length: 128 }),
  tokenCipher: text("token_cipher"),
  tokenHint: varchar("token_hint", { length: 8 }),
  webhookSecretCipher: text("webhook_secret_cipher"),
  lastError: text("last_error"),
  lastWebhookAt: timestamp("last_webhook_at", { withTimezone: true }),
  lastUpdateKind: varchar("last_update_kind", { length: 32 }),
  lastInboundStatus: integer("last_inbound_status"),
  telegramPendingCount: integer("telegram_pending_count"),
  telegramLastError: text("telegram_last_error"),
  connectedAt: timestamp("connected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Consent-before-phone for a Telegram quiz. Not a website login. */
export const botChatSessions = pgTable(
  "bot_chat_sessions",
  {
    botId: varchar("bot_id", { length: 32 })
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    telegramUserId: varchar("telegram_user_id", { length: 32 }).notNull(),
    chatId: varchar("chat_id", { length: 32 }).notNull(),
    consentedAt: timestamp("consented_at", { withTimezone: true }),
    awaitingReferral: boolean("awaiting_referral").notNull().default(false),
    step: varchar("step", { length: 32 }).notNull().default("start"),
    analyzerSlug: varchar("analyzer_slug", { length: 64 }),
    pendingPhone: varchar("pending_phone", { length: 16 }),
    viaContact: boolean("via_contact").notNull().default(false),
    awaitingDiscount: boolean("awaiting_discount").notNull().default(false),
    passwordLinkSentAt: timestamp("password_link_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.botId, t.telegramUserId] })],
);

export const accountAvatars = pgTable("account_avatars", {
  accountId: integer("account_id")
    .primaryKey()
    .references(() => accounts.id, { onDelete: "cascade" }),
  variant: integer("variant").notNull(),
  imageKey: varchar("image_key", { length: 160 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accountPublicCodes = pgTable("account_public_codes", {
  accountId: integer("account_id")
    .primaryKey()
    .references(() => accounts.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 8 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const passwordSetupTokens = pgTable("password_setup_tokens", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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

export const semanticRecords = pgTable("semantic_records", {
  id: text("id").primaryKey(),
  recordType: text("record_type").notNull().default("semantic_record"),
  kind: text("kind").notNull().default("observation"),
  titleFa: varchar("title_fa", { length: 256 }).notNull(),
  titleEn: varchar("title_en", { length: 256 }),
  slug: varchar("slug", { length: 128 }),
  status: text("status").notNull().default("captured"),
  visibility: text("visibility").notNull().default("private"),
  intent: text("intent"),
  summaryFa: text("summary_fa"),
  bodyFa: text("body_fa"),
  growth: text("growth"),
  readingMinutes: integer("reading_minutes"),
  lineFa: text("line_fa"),
  questionFa: text("question_fa"),
  rootFa: text("root_fa"),
  firstStepFa: text("first_step_fa"),
  marginNoteFa: text("margin_note_fa"),
  prunedAt: timestamp("pruned_at", { withTimezone: true }),
  audioUrl: text("audio_url"),
  simulator: jsonb("simulator"),
  closingQuestionFa: text("closing_question_fa"),
  closingOptions: jsonb("closing_options"),
  closingPromptFa: text("closing_prompt_fa"),
  relatedSlugs: jsonb("related_slugs").$type<string[]>(),
  language: text("language").notNull().default("fa"),
  ownerId: integer("owner_id").references(() => accounts.id, { onDelete: "set null" }),
  promotedMemoryId: text("promoted_memory_id"),
  schemaVersion: text("schema_version").notNull().default("0.1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const knowledgeClaims = pgTable("knowledge_claims", {
  id: text("id").primaryKey(),
  recordType: text("record_type").notNull().default("knowledge_claim"),
  subject: text("subject"),
  predicate: text("predicate").notNull().default("asserts"),
  objectValue: text("object_value"),
  statementFa: text("statement_fa"),
  statementEn: text("statement_en"),
  lifecycle: text("lifecycle").notNull().default("candidate"),
  confidence: text("confidence").notNull().default("hypothesis"),
  sourceRecordId: text("source_record_id").references(() => semanticRecords.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => accounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const knowledgeReviews = pgTable("knowledge_reviews", {
  id: text("id").primaryKey(),
  recordType: text("record_type").notNull().default("knowledge_review"),
  claimId: text("claim_id").references(() => knowledgeClaims.id, { onDelete: "set null" }),
  reviewerId: integer("reviewer_id").references(() => accounts.id, { onDelete: "set null" }),
  decision: text("decision").notNull().default("approve"),
  rationaleFa: text("rationale_fa"),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const memoryItems = pgTable("memory_items", {
  id: text("id").primaryKey(),
  recordType: text("record_type").notNull().default("memory_item"),
  kind: text("kind").notNull().default("validated_pattern"),
  titleFa: varchar("title_fa", { length: 256 }).notNull(),
  titleEn: varchar("title_en", { length: 256 }),
  summaryFa: text("summary_fa"),
  bodyFa: text("body_fa"),
  lifecycle: text("lifecycle").notNull().default("approved"),
  visibility: text("visibility").notNull().default("public"),
  confidence: text("confidence").notNull().default("validated"),
  sourceClaimId: text("source_claim_id").references(() => knowledgeClaims.id, { onDelete: "set null" }),
  sourceRecordId: text("source_record_id").references(() => semanticRecords.id, { onDelete: "set null" }),
  promotionId: text("promotion_id"),
  revision: integer("revision").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const knowledgePromotions = pgTable("knowledge_promotions", {
  id: text("id").primaryKey(),
  recordType: text("record_type").notNull().default("knowledge_promotion"),
  claimId: text("claim_id").references(() => knowledgeClaims.id, { onDelete: "set null" }),
  reviewId: text("review_id").references(() => knowledgeReviews.id, { onDelete: "set null" }),
  targetMemoryId: text("target_memory_id").references(() => memoryItems.id, { onDelete: "set null" }),
  targetKind: text("target_kind").notNull().default("validated_pattern"),
  promotedBy: integer("promoted_by").references(() => accounts.id, { onDelete: "set null" }),
  rationaleFa: text("rationale_fa"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const graphEdges = pgTable("graph_edges", {
  id: text("id").primaryKey(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  relationType: text("relation_type").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  edgeClass: text("edge_class").notNull().default("publication"),
  status: text("status").notNull().default("active"),
  confidence: text("confidence").notNull().default("validated"),
  createdBy: integer("created_by").references(() => accounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const evidenceSources = pgTable("evidence_sources", {
  id: text("id").primaryKey(),
  recordType: text("record_type").notNull().default("evidence_source"),
  sourceType: text("source_type").notNull().default("human_input"),
  sourceId: text("source_id"),
  titleFa: text("title_fa"),
  locator: text("locator"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const provenanceRecords = pgTable("provenance_records", {
  id: text("id").primaryKey(),
  recordType: text("record_type").notNull().default("provenance_record"),
  subjectType: text("subject_type").notNull(),
  subjectId: text("subject_id").notNull(),
  sourceType: text("source_type").notNull().default("human_input"),
  actorId: integer("actor_id").references(() => accounts.id, { onDelete: "set null" }),
  transformation: text("transformation"),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow(),
  schemaVersion: text("schema_version").notNull().default("0.1"),
});

export const shopPayoutDestinations = pgTable("shop_payout_destinations", {
  id: integer("id").primaryKey(),
  accountHandle: text("account_handle").notNull(),
  accountAlias: text("account_alias"),
  updatedBy: integer("updated_by").references(() => accounts.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type ShopSpec = { key: string; value: string };

export const shopSettings = pgTable("shop_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const shopListings = pgTable("shop_listings", {
  id: text("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  titleFa: varchar("title_fa", { length: 256 }).notNull(),
  titleEn: varchar("title_en", { length: 256 }),
  summaryFa: text("summary_fa"),
  bodyFa: text("body_fa"),
  accessBodyFa: text("access_body_fa"),
  kind: text("kind").notNull().default("digital_entitlement"),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("IRR"),
  usdRatio: doublePrecision("usd_ratio"),
  comparePrice: integer("compare_price"),
  specs: jsonb("specs").$type<ShopSpec[]>(),
  coverImageUrl: text("cover_image_url"),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "set null" }),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const shopListingImages = pgTable("shop_listing_images", {
  id: serial("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => shopListings.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  thumbUrl: text("thumb_url"),
  position: integer("position").notNull().default(0),
});

export const shopOrders = pgTable("shop_orders", {
  id: text("id").primaryKey(),
  buyerId: integer("buyer_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  listingId: text("listing_id")
    .notNull()
    .references(() => shopListings.id, { onDelete: "restrict" }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("IRR"),
  state: text("state").notNull().default("awaiting_payment_reference"),
  paymentReference: text("payment_reference"),
  declineReason: text("decline_reason"),
  payoutHandleSnapshot: text("payout_handle_snapshot"),
  payoutAliasSnapshot: text("payout_alias_snapshot"),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  discountCode: varchar("discount_code", { length: 32 }),
  discountAmount: integer("discount_amount").notNull().default(0),
  originalAmount: integer("original_amount"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  kind: varchar("kind", { length: 16 }).notNull().default("percent"),
  value: integer("value").notNull(),
  scope: varchar("scope", { length: 16 }).notNull().default("any"),
  analyzerSlug: varchar("analyzer_slug", { length: 64 }),
  listingId: text("listing_id"),
  productId: varchar("product_id", { length: 128 }),
  issuerAccountId: integer("issuer_account_id").references(() => accounts.id, { onDelete: "set null" }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdBy: integer("created_by").references(() => accounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const discountRedemptions = pgTable("discount_redemptions", {
  id: serial("id").primaryKey(),
  discountId: integer("discount_id")
    .notNull()
    .references(() => discountCodes.id, { onDelete: "cascade" }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  source: varchar("source", { length: 16 }).notNull(),
  analyzerSlug: varchar("analyzer_slug", { length: 64 }),
  orderId: text("order_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shopEntitlements = pgTable(
  "shop_entitlements",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    listingId: text("listing_id")
      .notNull()
      .references(() => shopListings.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => shopOrders.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.accountId, t.listingId)]
);

export const shopOrderEvents = pgTable("shop_order_events", {
  id: serial("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => shopOrders.id, { onDelete: "cascade" }),
  actorId: integer("actor_id").references(() => accounts.id, { onDelete: "set null" }),
  actorRole: text("actor_role").notNull(),
  kind: text("kind").notNull(),
  fromState: text("from_state"),
  toState: text("to_state").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Exact IRR rials. Party null = platform/bank. */
export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  eventKey: varchar("event_key", { length: 200 }).notNull().unique(),
  kind: varchar("kind", { length: 32 }).notNull(),
  sourceType: varchar("source_type", { length: 32 }).notNull(),
  sourceId: varchar("source_id", { length: 120 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("IRR"),
  payloadHash: text("payload_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ledgerLines = pgTable("ledger_lines", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id")
    .notNull()
    .references(() => ledgerEntries.id, { onDelete: "cascade" }),
  account: varchar("account", { length: 32 }).notNull(),
  partyId: integer("party_id").references(() => accounts.id, { onDelete: "restrict" }),
  side: varchar("side", { length: 8 }).notNull(),
  amountIrr: bigint("amount_irr", { mode: "bigint" }).notNull(),
});

export const assessmentTariffs = pgTable(
  "assessment_tariffs",
  {
    id: text("id").primaryKey(),
    analyzerSlug: varchar("analyzer_slug", { length: 64 }).notNull(),
    service: varchar("service", { length: 32 }).notNull(),
    creatorId: integer("creator_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    priceIrr: bigint("price_irr", { mode: "bigint" }).notNull(),
    commissionBps: integer("commission_bps"),
    rounding: varchar("rounding", { length: 8 }),
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.analyzerSlug, t.service, t.version)],
);

export const assessmentOrders = pgTable("assessment_orders", {
  id: text("id").primaryKey(),
  buyerId: integer("buyer_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  analyzerSlug: varchar("analyzer_slug", { length: 64 }).notNull(),
  attemptKind: varchar("attempt_kind", { length: 16 }).notNull(),
  attemptId: integer("attempt_id").notNull(),
  service: varchar("service", { length: 32 }).notNull(),
  tariffId: text("tariff_id")
    .notNull()
    .references(() => assessmentTariffs.id, { onDelete: "restrict" }),
  tariffVersion: integer("tariff_version").notNull(),
  priceIrr: bigint("price_irr", { mode: "bigint" }).notNull(),
  discountIrr: bigint("discount_irr", { mode: "bigint" }).notNull(),
  payableIrr: bigint("payable_irr", { mode: "bigint" }).notNull(),
  platformFeeIrr: bigint("platform_fee_irr", { mode: "bigint" }).notNull(),
  authorCreditIrr: bigint("author_credit_irr", { mode: "bigint" }).notNull(),
  authorNetIrr: bigint("author_net_irr", { mode: "bigint" }).notNull(),
  commissionBps: integer("commission_bps").notNull(),
  rounding: varchar("rounding", { length: 8 }),
  currency: varchar("currency", { length: 8 }).notNull().default("IRR"),
  state: varchar("state", { length: 32 }).notNull(),
  discountCode: varchar("discount_code", { length: 32 }),
  discountId: integer("discount_id"),
  paymentReference: text("payment_reference"),
  capturedAt: timestamp("captured_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assessmentEntitlements = pgTable(
  "assessment_entitlements",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    attemptKind: varchar("attempt_kind", { length: 16 }).notNull(),
    attemptId: integer("attempt_id").notNull(),
    service: varchar("service", { length: 32 }).notNull(),
    orderId: text("order_id")
      .notNull()
      .references(() => assessmentOrders.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.accountId, t.attemptKind, t.attemptId, t.service)],
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

export const accountsRelations = relations(accounts, ({ many, one }) => ({
  sessions: many(sessions),
  authEvents: many(authEvents),
  publicCode: one(accountPublicCodes, {
    fields: [accounts.id],
    references: [accountPublicCodes.accountId],
  }),
  avatar: one(accountAvatars, {
    fields: [accounts.id],
    references: [accountAvatars.accountId],
  }),
}));

export const accountAvatarsRelations = relations(accountAvatars, ({ one }) => ({
  account: one(accounts, {
    fields: [accountAvatars.accountId],
    references: [accounts.id],
  }),
}));

export const accountPublicCodesRelations = relations(accountPublicCodes, ({ one }) => ({
  account: one(accounts, {
    fields: [accountPublicCodes.accountId],
    references: [accounts.id],
  }),
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
