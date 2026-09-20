import { db, pool } from "./index";
import {
  person,
  topics,
  knowledge,
  courses,
  lessons,
  projects,
  projectDocuments,
  skills,
  roles,
  organizations,
  knowledgeTopics,
  courseTopics,
  courseSkills,
  projectTopics,
  projectSkills,
  projectRequiredRoles,
  knowledgeProjects,
  courseProjects,
  personSkills,
  personTopics,
  personOrganizations,
  conversations,
  messages,
  knowledgeSlides,
  authEvents,
  sessions,
  otpChallenges,
  rateLimitBuckets,
  accounts,
} from "./schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding Hadiran Web3...");

  // Clean tables (respect FK order)
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(authEvents);
  await db.delete(sessions);
  await db.delete(otpChallenges);
  await db.delete(rateLimitBuckets);
  await db.delete(accounts);
  await db.delete(personOrganizations);
  await db.delete(personSkills);
  await db.delete(personTopics);
  await db.delete(knowledgeProjects);
  await db.delete(courseProjects);
  await db.delete(projectRequiredRoles);
  await db.delete(projectSkills);
  await db.delete(projectTopics);
  await db.delete(courseSkills);
  await db.delete(courseTopics);
  await db.delete(knowledgeTopics);
  await db.delete(knowledgeSlides);
  await db.delete(projectDocuments);
  await db.delete(lessons);
  await db.delete(collaborationsTable());
  await db.delete(projects);
  await db.delete(courses);
  await db.delete(knowledge);
  await db.delete(organizations);
  await db.delete(roles);
  await db.delete(skills);
  await db.delete(topics);
  await db.delete(person);

  const resetSequences = [
    "person",
    "topics",
    "knowledge",
    "knowledge_slides",
    "courses",
    "lessons",
    "projects",
    "project_documents",
    "skills",
    "roles",
    "organizations",
    "collaborations",
    "conversations",
    "messages",
  ];
  for (const table of resetSequences) {
    await db.execute(sql`ALTER SEQUENCE ${sql.raw(table)}_id_seq RESTART WITH 1`);
  }

  // ---------- Person ----------
  const [hadiran] = await db
    .insert(person)
    .values({
      slug: "hadiran",
      nameFa: "هادیران",
      nameEn: "Hadiran",
      avatarUrl: "/hadiran-avatar.svg",
      introFa:
        "هادیران، سازنده اکوسیستم هادیران‌وب۳ است. او بین فناوری، فلسفه و اجرای پروژه‌های Web3 پل می‌زند و معتقد است دانش باید به‌هم‌پیوسته، قابل بازیابی و آماده همکاری باشد.",
      storyFa:
        "سفر هادیران از کنجکاوی دربارهٔ شبکه‌های غیرمتمرکز و اقتصاد رمزارز آغاز شد. با گذر زمان، تمرکز او به سمت ساختن ابزارهایی رفت که دانش و پروژه‌ها را به یکدیگر پیوند دهند: یک دانشنامه زنده، یک آکادمی و یک آزمایشگاه برای آزمون ایده‌ها.",
      pathFa:
        "مسیر او ترکیبی از تحقیق مستقل، تدریس، توسعه پروژه‌های آزمایشی و نوشتن دربارهٔ مفاهیم کلیدی Web3، اتوماسیون و هوش مصنوعی است.",
      perspectiveFa:
        "باور هادیران این است: فناوری باید شفاف‌ساز باشد، نه پیچیده‌ساز. پروژه باید از یک پرسش روشن و یک سند استراتژیک شروع شود و هر موجودیت دانشی باید بتواند به موجودیت‌های دیگر متصل گردد.",
      principlesFa: [
        "ابتدا هستی‌شناسی، سپس رابط کاربری",
        "همه چیز به هم متصل است",
        "پروژه یک ظرف است، نه یک کارت نمونه‌کار",
        "مستندات هر کدام کار خود را دارند",
        "محتوا برای AI قابل خواندن طراحی شود",
      ],
      contactMethods: [
        { label: "ایمیل", value: "hello@hadiran.web3", url: "mailto:hello@hadiran.web3" },
        { label: "توییتر / X", value: "@hadiran_web3", url: "https://x.com/hadiran_web3" },
        { label: "گیت‌هاب", value: "github.com/hadiran", url: "https://github.com/hadiran" },
      ],
    })
    .returning();

  // ---------- Topics ----------
  const topicValues = [
    {
      slug: "ai",
      labelFa: "هوش مصنوعی",
      labelEn: "AI",
      color: "#8b5cf6",
      descriptionFa:
        "مدل‌های زبانی و عامل‌های هوشمند برای بازیابی دانش، اتصال به ابزار، و شفاف‌سازی مسئله در اکوسیستم هادیران.",
    },
    {
      slug: "mcp",
      labelFa: "MCP",
      labelEn: "MCP",
      color: "#f59e0b",
      descriptionFa:
        "پروتکل باز Model Context Protocol برای اتصال مدل به داده، فایل و ابزار واقعی — بدون جعبه‌سیاه فروشنده.",
    },
    {
      slug: "web3",
      labelFa: "وب۳",
      labelEn: "Web3",
      color: "#3b82f6",
      descriptionFa:
        "لایهٔ مالکیت دیجیتال اینترنت: رمزنگاری، قرارداد هوشمند و شبکهٔ توزیع‌شده به‌جای پلتفرم متمرکز.",
    },
    {
      slug: "automation",
      labelFa: "اتوماسیون",
      labelEn: "Automation",
      color: "#10b981",
      descriptionFa:
        "حذف کار تکراری با مرز روشن بین آنچه ماشین می‌تواند انجام دهد و آنچه نیاز به قضاوت انسانی دارد.",
    },
    {
      slug: "docker",
      labelFa: "داکر",
      labelEn: "Docker",
      color: "#0ea5e9",
      descriptionFa: "بسته‌بندی و اجرای یکسان محیط توسعه، سرویس و آزمایش — زیربنای تحویل تکرارپذیر.",
    },
    {
      slug: "blockchain",
      labelFa: "بلاکچین",
      labelEn: "Blockchain",
      color: "#6366f1",
      descriptionFa: "دفترکل توزیع‌شده به‌عنوان زیربنای دارایی دیجیتال، هویت و قرارداد هوشمند.",
    },
    {
      slug: "knowledge-graph",
      labelFa: "گراف دانش",
      labelEn: "Knowledge Graph",
      color: "#ec4899",
      descriptionFa:
        "موجودیت‌ها و روابط پایدار؛ هستی‌شناسی اول، رابط کاربری بعد. پل بین دانش، پروژه و دوره.",
    },
    {
      slug: "typescript",
      labelFa: "تایپ‌اسکریپت",
      labelEn: "TypeScript",
      color: "#3178c6",
      descriptionFa: "زبان تایپ‌شده برای محصول، ابزار MCP و لایهٔ ارائهٔ هادیران.",
    },
  ];
  const insertedTopics = await db.insert(topics).values(topicValues).returning();
  const topicBySlug = Object.fromEntries(insertedTopics.map((t) => [t.slug, t])) as Record<
    string,
    (typeof insertedTopics)[number]
  >;

  // ---------- Skills ----------
  const skillValues = [
    { slug: "typescript", labelFa: "تایپ‌اسکریپت", labelEn: "TypeScript" },
    { slug: "react", labelFa: "ری‌اکت", labelEn: "React" },
    { slug: "nextjs", labelFa: "نکست‌جی‌اس", labelEn: "Next.js" },
    { slug: "drizzle", labelFa: "Drizzle ORM", labelEn: "Drizzle ORM" },
    { slug: "docker", labelFa: "داکر", labelEn: "Docker" },
    { slug: "postgres", labelFa: "پستگرس", labelEn: "PostgreSQL" },
    { slug: "solidity", labelFa: "سالیدیتی", labelEn: "Solidity" },
    { slug: "product-design", labelFa: "طراحی محصول", labelEn: "Product Design" },
    { slug: "technical-writing", labelFa: "نویسندگی فنی", labelEn: "Technical Writing" },
    { slug: "ai-integration", labelFa: "یکپارچه‌سازی AI", labelEn: "AI Integration" },
  ];
  const insertedSkills = await db.insert(skills).values(skillValues).returning();
  const skillBySlug = Object.fromEntries(insertedSkills.map((s) => [s.slug, s])) as Record<
    string,
    (typeof insertedSkills)[number]
  >;

  // ---------- Roles ----------
  const roleValues = [
    { slug: "frontend-dev", labelFa: "توسعه‌دهنده فرانت‌اند", labelEn: "Frontend Developer" },
    { slug: "backend-dev", labelFa: "توسعه‌دهنده بک‌اند", labelEn: "Backend Developer" },
    { slug: "smart-contract-dev", labelFa: "توسعه‌دهنده قرارداد هوشمند", labelEn: "Smart Contract Developer" },
    { slug: "technical-writer", labelFa: "نویسنده فنی", labelEn: "Technical Writer" },
    { slug: "product-designer", labelFa: "طراح محصول", labelEn: "Product Designer" },
    { slug: "researcher", labelFa: "پژوهشگر", labelEn: "Researcher" },
  ];
  const insertedRoles = await db.insert(roles).values(roleValues).returning();
  const roleBySlug = Object.fromEntries(insertedRoles.map((r) => [r.slug, r])) as Record<
    string,
    (typeof insertedRoles)[number]
  >;

  // ---------- Organizations ----------
  const orgValues = [
    {
      slug: "hadiran-web3",
      nameFa: "هادیران‌وب۳",
      nameEn: "Hadiran Web3",
      descriptionFa: "اکوسیستم شخصی هادیران برای دانش، آموزش و پروژه.",
    },
    {
      slug: "open-web-academy",
      nameFa: "آکادمی وب باز",
      nameEn: "Open Web Academy",
      descriptionFa: "مجموعه‌ای از دوره‌های آزاد Web3.",
    },
  ];
  const insertedOrgs = await db.insert(organizations).values(orgValues).returning();
  const orgBySlug = Object.fromEntries(insertedOrgs.map((o) => [o.slug, o])) as Record<
    string,
    (typeof insertedOrgs)[number]
  >;

  // Person links
  await db.insert(personSkills).values([
    { personId: hadiran.id, skillId: skillBySlug.typescript.id },
    { personId: hadiran.id, skillId: skillBySlug.nextjs.id },
    { personId: hadiran.id, skillId: skillBySlug.docker.id },
    { personId: hadiran.id, skillId: skillBySlug["ai-integration"].id },
    { personId: hadiran.id, skillId: skillBySlug["technical-writing"].id },
  ]);
  await db.insert(personTopics).values([
    { personId: hadiran.id, topicId: topicBySlug.web3.id },
    { personId: hadiran.id, topicId: topicBySlug.ai.id },
    { personId: hadiran.id, topicId: topicBySlug.automation.id },
    { personId: hadiran.id, topicId: topicBySlug["knowledge-graph"].id },
  ]);
  await db.insert(personOrganizations).values([
    { personId: hadiran.id, organizationId: orgBySlug["hadiran-web3"].id, roleFa: "بنیان‌گذار" },
    { personId: hadiran.id, organizationId: orgBySlug["open-web-academy"].id, roleFa: "مربی" },
  ]);

  // ---------- Knowledge ----------
  const knowledgeValues = [
    {
      slug: "what-is-web3",
      type: "article" as const,
      titleFa: "وب۳ چیست؟",
      titleEn: "What is Web3?",
      summaryFa: "نگاهی به مفهوم وب۳، تفاوت آن با وب۲ و چرایی اهمیت مالکیت دیجیتال.",
      bodyFa:
        "## مالکیت دیجیتال\n\nوب۳ لایه‌ای از اینترنت است که در آن کاربران مالک داده‌ها و دارایی‌های دیجیتال خود هستند. برخلاف وب۲ که پلتفرم‌های متمرکز حاکم‌اند، وب۳ اعتماد را به **کد** منتقل می‌کند.\n\n- رمزنگاری\n- قراردادهای هوشمند\n- شبکه‌های توزیع‌شده",
    },
    {
      slug: "mcp-protocol",
      type: "research" as const,
      titleFa: "پروتکل MCP",
      titleEn: "MCP Protocol",
      summaryFa: "بررسی پروتکل Model Context Provider و نقش آن در اتصال AI به ابزارها.",
      bodyFa:
        "## اتصال مدل به واقعیت\n\n**MCP** یا Model Context Protocol یک استاندارد باز برای اتصال مدل‌های زبانی به منابع داده و ابزارهاست.\n\n- APIها\n- پایگاه داده\n- سیستم‌های محلی\n\nهدف: تعامل **ایمن و شفاف**، نه جعبه‌سیاه.",
    },
    {
      slug: "knowledge-graph-design",
      type: "article" as const,
      titleFa: "طراحی گراف دانش",
      titleEn: "Knowledge Graph Design",
      summaryFa: "اصول طراحی موجودیت‌ها و روابط برای ساخت یک گراف دانش زنده.",
      bodyFa:
        "## اول هستی‌شناسی\n\nیک گراف دانش خوب وقتی شکل می‌گیرد که ابتدا هستی‌شناسی را تعریف کنیم:\n\n- موجودیت‌ها چه هستند؟\n- چه روابطی با هم دارند؟\n- هر موجودیت چه ویژگی‌هایی دارد؟\n\nسپس رابط کاربری می‌تواند روی این ساختار پایدار بنا شود.",
    },
    {
      slug: "automation-mindset",
      type: "note" as const,
      titleFa: "ذهنیت اتوماسیون",
      titleEn: "Automation Mindset",
      summaryFa: "یادداشتی کوتاه دربارهٔ اینکه اتوماسیون ابتدا یک طرز فکر است و سپس ابزار.",
      bodyFa:
        "قبل از نوشتن یک اسکریپت یا استفاده از n8n، باید پرسید: کدام کار تکراری است؟ کجا تصمیم‌گیری انسانی ضروری است؟ اتوماسیون موفق، مرز بین آنچه ماشین می‌تواند انجام دهد و آنچه نیاز به قضاوت انسانی دارد را روشن می‌کند.",
    },
    {
      slug: "decentralized-identity-idea",
      type: "idea" as const,
      titleFa: "ایده هویت غیرمتمرکز برای اکوسیستم شخصی",
      titleEn: "Decentralized Identity Idea",
      summaryFa: "ایده اولیه برای استفاده از DID در پروفایل سازنده اکوسیستم.",
      bodyFa:
        "## هویت قابل‌انتقال\n\nاگر هر سازنده هویت دیجیتال خود را با **DID** مدیریت کند، اعتماد بین او، پروژه‌ها، دوره‌ها و مخاطبان بدون وابستگی به پلتفرم مرکزی منتقل می‌شود.",
    },
  ];
  const insertedKnowledge = await db.insert(knowledge).values(knowledgeValues).returning();
  const knowledgeBySlug = Object.fromEntries(insertedKnowledge.map((k) => [k.slug, k])) as Record<
    string,
    (typeof insertedKnowledge)[number]
  >;

  await db.insert(knowledgeSlides).values([
    {
      knowledgeId: knowledgeBySlug["what-is-web3"].id,
      sortOrder: 0,
      titleFa: "وب۲ در برابر وب۳",
      bodyFa: "در وب۲ پلتفرم مالک داده است. در وب۳ کاربر مالک دارایی و هویت دیجیتال خودش می‌ماند.",
    },
    {
      knowledgeId: knowledgeBySlug["what-is-web3"].id,
      sortOrder: 1,
      titleFa: "اعتماد به کد",
      bodyFa: "رمزنگاری، قرارداد هوشمند و شبکه توزیع‌شده، اعتماد را از نهاد متمرکز به قواعد قابل‌بازرسی منتقل می‌کنند.",
    },
    {
      knowledgeId: knowledgeBySlug["what-is-web3"].id,
      sortOrder: 2,
      titleFa: "چرا برای سازنده مهم است؟",
      bodyFa: "دانش، دوره و پروژه وقتی روی مالکیت باز بنا شوند، از پلتفرم جدا می‌مانند و قابل انتقال‌اند.",
    },
    {
      knowledgeId: knowledgeBySlug["mcp-protocol"].id,
      sortOrder: 0,
      titleFa: "مدل به‌تنهایی کافی نیست",
      bodyFa: "LLM بدون ابزار، به دادهٔ تازه و سیستم داخلی دسترسی ندارد. MCP این فاصله را پر می‌کند.",
    },
    {
      knowledgeId: knowledgeBySlug["mcp-protocol"].id,
      sortOrder: 1,
      titleFa: "پروتکل باز",
      bodyFa: "سرور MCP ابزار را توصیف می‌کند؛ کلاینت مدل آن را صدا می‌زند. استاندارد است، نه قفل فروشنده.",
    },
  ]);

  await db.insert(knowledgeTopics).values([
    { knowledgeId: knowledgeBySlug["what-is-web3"].id, topicId: topicBySlug.web3.id },
    { knowledgeId: knowledgeBySlug["what-is-web3"].id, topicId: topicBySlug.blockchain.id },
    { knowledgeId: knowledgeBySlug["mcp-protocol"].id, topicId: topicBySlug.ai.id },
    { knowledgeId: knowledgeBySlug["mcp-protocol"].id, topicId: topicBySlug.mcp.id },
    { knowledgeId: knowledgeBySlug["knowledge-graph-design"].id, topicId: topicBySlug["knowledge-graph"].id },
    { knowledgeId: knowledgeBySlug["automation-mindset"].id, topicId: topicBySlug.automation.id },
    { knowledgeId: knowledgeBySlug["automation-mindset"].id, topicId: topicBySlug.ai.id },
    { knowledgeId: knowledgeBySlug["decentralized-identity-idea"].id, topicId: topicBySlug.web3.id },
  ]);

  // ---------- Courses ----------
  const courseValues = [
    {
      slug: "web3-fundamentals",
      type: "free" as const,
      titleFa: "مبانی وب۳",
      titleEn: "Web3 Fundamentals",
      descriptionFa: "دوره مقدماتی برای درک مفاهیم پایه وب۳، بلاکچین و قراردادهای هوشمند.",
      level: "مقدماتی",
      durationMinutes: 240,
    },
    {
      slug: "ai-integration-lab",
      type: "paid" as const,
      titleFa: "آزمایشگاه یکپارچه‌سازی AI",
      titleEn: "AI Integration Lab",
      descriptionFa: "ساخت رابط‌های هوشمند با LLMها، MCP و PostgreSQL برای محصولات واقعی.",
      level: "پیشرفته",
      durationMinutes: 420,
      price: 4500000,
    },
  ];
  const insertedCourses = await db.insert(courses).values(courseValues).returning();
  const courseBySlug = Object.fromEntries(insertedCourses.map((c) => [c.slug, c])) as Record<
    string,
    (typeof insertedCourses)[number]
  >;

  await db.insert(lessons).values([
    { courseId: courseBySlug["web3-fundamentals"].id, slug: "intro", titleFa: "مقدمه‌ای بر وب۳", order: 1, durationMinutes: 30 },
    { courseId: courseBySlug["web3-fundamentals"].id, slug: "blockchain-basics", titleFa: "مبانی بلاکچین", order: 2, durationMinutes: 45 },
    { courseId: courseBySlug["web3-fundamentals"].id, slug: "smart-contracts", titleFa: "قراردادهای هوشمند", order: 3, durationMinutes: 60 },
    { courseId: courseBySlug["ai-integration-lab"].id, slug: "llm-basics", titleFa: "آشنایی با LLMها", order: 1, durationMinutes: 60 },
    { courseId: courseBySlug["ai-integration-lab"].id, slug: "mcp-deep-dive", titleFa: "عمیق در MCP", order: 2, durationMinutes: 90 },
  ]);

  await db.insert(courseTopics).values([
    { courseId: courseBySlug["web3-fundamentals"].id, topicId: topicBySlug.web3.id },
    { courseId: courseBySlug["web3-fundamentals"].id, topicId: topicBySlug.blockchain.id },
    { courseId: courseBySlug["ai-integration-lab"].id, topicId: topicBySlug.ai.id },
    { courseId: courseBySlug["ai-integration-lab"].id, topicId: topicBySlug.mcp.id },
  ]);
  await db.insert(courseSkills).values([
    { courseId: courseBySlug["web3-fundamentals"].id, skillId: skillBySlug.solidity.id },
    { courseId: courseBySlug["ai-integration-lab"].id, skillId: skillBySlug.typescript.id },
    { courseId: courseBySlug["ai-integration-lab"].id, skillId: skillBySlug.nextjs.id },
    { courseId: courseBySlug["ai-integration-lab"].id, skillId: skillBySlug["ai-integration"].id },
  ]);

  // ---------- Projects ----------
  const projectValues = [
    {
      slug: "hadiran-web3-platform",
      nameFa: "پلتفرم هادیران‌وب۳",
      nameEn: "Hadiran Web3 Platform",
      descriptionFa: "اکوسیستم شخصی برای نمایش هویت، دانش، دوره‌ها و پروژه‌های هادیران.",
      category: "Platform",
      status: "development" as const,
      progress: 40,
      priority: "بالا",
      problemFa: "سازندگان دانش و پروژه اغلب محتوا و کار خود را در سکوهای پراکنده نگه می‌دارند و ارتباط میان آنها از بین می‌رود.",
      visionFa: "یک مدل دانش واحد که در آن AI بتواند پاسخگو، کشف‌کننده و راهنمای اکوسیستم شخصی باشد.",
      conceptFa: "ترکیب Person، Knowledge، Course و Project در یک گراف دانش متصل با رابط مکالمه‌ای AI.",
      objectivesFa: [
        "اتصال دانش، دوره و پروژه از طریق Topic",
        "ارائه رابط AI برای پرسش و کشف",
        "امکان درخواست همکاری روی پروژه‌ها",
      ],
      externalLinks: [
        { label: "گیت‌هاب", url: "https://github.com/hadiran/hadiran-web3" },
        { label: "مستندات", url: "#" },
      ],
    },
    {
      slug: "mcp-toolkit",
      nameFa: "کیت ابزار MCP",
      nameEn: "MCP Toolkit",
      descriptionFa: "مجموعه سرورها و کلاینت‌های MCP برای اتصال AI به پایگاه داده، فایل و APIهای رایج.",
      category: "Experiment",
      status: "prototype" as const,
      progress: 25,
      priority: "متوسط",
      problemFa: "مدل‌های زبانی به تنهایی به داده‌های تازه و منابع داخلی دسترسی ندارند.",
      visionFa: "یک toolkit متن‌باز که توسعه‌دهندگان بتوانند سریعاً سرورهای MCP بسازند و با LLMها یکپارچه کنند.",
      conceptFa: "پیاده‌سازی سرورهای MCP روی PostgreSQL، فایل‌سیستم و Docker با مثال‌های عملی.",
      objectivesFa: [
        "ارائه قالب آماده سرور MCP",
        "اتصال به PostgreSQL و Drizzle",
        "مثال‌های یکپارچه‌سازی با Claude و OpenAI",
      ],
      externalLinks: [{ label: "گیت‌هاب", url: "https://github.com/hadiran/mcp-toolkit" }],
    },
  ];
  const insertedProjects = await db.insert(projects).values(projectValues).returning();
  const projectBySlug = Object.fromEntries(insertedProjects.map((p) => [p.slug, p])) as Record<
    string,
    (typeof insertedProjects)[number]
  >;

  await db.insert(projectTopics).values([
    { projectId: projectBySlug["hadiran-web3-platform"].id, topicId: topicBySlug.web3.id },
    { projectId: projectBySlug["hadiran-web3-platform"].id, topicId: topicBySlug["knowledge-graph"].id },
    { projectId: projectBySlug["hadiran-web3-platform"].id, topicId: topicBySlug.ai.id },
    { projectId: projectBySlug["hadiran-web3-platform"].id, topicId: topicBySlug.typescript.id },
    { projectId: projectBySlug["mcp-toolkit"].id, topicId: topicBySlug.mcp.id },
    { projectId: projectBySlug["mcp-toolkit"].id, topicId: topicBySlug.ai.id },
    { projectId: projectBySlug["mcp-toolkit"].id, topicId: topicBySlug.docker.id },
  ]);
  await db.insert(projectSkills).values([
    { projectId: projectBySlug["hadiran-web3-platform"].id, skillId: skillBySlug.nextjs.id },
    { projectId: projectBySlug["hadiran-web3-platform"].id, skillId: skillBySlug.drizzle.id },
    { projectId: projectBySlug["hadiran-web3-platform"].id, skillId: skillBySlug.postgres.id },
    { projectId: projectBySlug["mcp-toolkit"].id, skillId: skillBySlug.typescript.id },
    { projectId: projectBySlug["mcp-toolkit"].id, skillId: skillBySlug.docker.id },
  ]);
  await db.insert(projectRequiredRoles).values([
    { projectId: projectBySlug["hadiran-web3-platform"].id, roleId: roleBySlug["frontend-dev"].id, count: 1 },
    { projectId: projectBySlug["hadiran-web3-platform"].id, roleId: roleBySlug["backend-dev"].id, count: 1 },
    { projectId: projectBySlug["hadiran-web3-platform"].id, roleId: roleBySlug["technical-writer"].id, count: 1 },
    { projectId: projectBySlug["mcp-toolkit"].id, roleId: roleBySlug["backend-dev"].id, count: 1 },
    { projectId: projectBySlug["mcp-toolkit"].id, roleId: roleBySlug["technical-writer"].id, count: 1 },
  ]);

  await db.insert(projectDocuments).values([
    {
      projectId: projectBySlug["hadiran-web3-platform"].id,
      type: "whitepaper",
      titleFa: "وایت‌پیپر پلتفرم هادیران‌وب۳",
      bodyFa:
        "چرا؟ سازندگان نیاز به فضایی واحد برای هویت، دانش و پروژه دارند. چیست؟ یک اکوسیستم شخصی مبتنی بر گراف دانش. برای چه کسانی؟ مخاطبان کنجکاو، دانشجویان Web3 و همکاران بالقوه.",
    },
    {
      projectId: projectBySlug["hadiran-web3-platform"].id,
      type: "blueprint",
      titleFa: "بلوپرینت معماری",
      bodyFa:
        "نکست‌جی‌اس به‌عنوان لایه ارائه، Drizzle + PostgreSQL برای ذخیره‌سازی گراف دانش، API Routes برای AI و فرم‌های همکاری. موجودیت‌ها از طریق Topic و Join Tables به هم متصل می‌شوند.",
    },
    {
      projectId: projectBySlug["hadiran-web3-platform"].id,
      type: "roadmap",
      titleFa: "نقشه راه",
      bodyFa:
        "فاز ۰: هستی‌شناسی و معماری اطلاعات. فاز ۱: پیاده‌سازی چهار جهان اصلی. فاز ۲: رابط AI و بازیابی دانش. فاز ۳: سیستم همکاری و درخواست عضویت.",
    },
    {
      projectId: projectBySlug["hadiran-web3-platform"].id,
      type: "gantt",
      titleFa: "برنامه زمان‌بندی",
      bodyFa:
        "هفته ۱–۲: طراحی schema و seed. هفته ۳–۴: صفحات اصلی و ناوبری. هفته ۵–۶: رابط AI و API. هفته ۷–۸: سیستم همکاری و بهینه‌سازی.",
    },
    {
      projectId: projectBySlug["mcp-toolkit"].id,
      type: "whitepaper",
      titleFa: "وایت‌پیپر MCP Toolkit",
      bodyFa:
        "چرا؟ LLMها به تنهایی به منابع داخلی دسترسی ندارند. چیست؟ مجموعه‌ای از سرورهای MCP برای ابزارهای رایج. چشم‌انداز: تسریع در ساختن agentهای متصل به واقعیت.",
    },
    {
      projectId: projectBySlug["mcp-toolkit"].id,
      type: "blueprint",
      titleFa: "بلوپرینت MCP Toolkit",
      bodyFa:
        "هر سرور MCP به‌صورت یک بسته مستقل تایپ‌اسکریپت پیاده‌سازی می‌شود. کلاینت‌ها از طریق stdio یا HTTP به سرور متصل می‌شوند. نمونه‌هایی برای PostgreSQL، Docker و فایل‌سیستم ارائه می‌شود.",
    },
  ]);

  // Cross-links
  await db.insert(knowledgeProjects).values([
    { knowledgeId: knowledgeBySlug["knowledge-graph-design"].id, projectId: projectBySlug["hadiran-web3-platform"].id },
    { knowledgeId: knowledgeBySlug["mcp-protocol"].id, projectId: projectBySlug["mcp-toolkit"].id },
  ]);
  await db.insert(courseProjects).values([
    { courseId: courseBySlug["ai-integration-lab"].id, projectId: projectBySlug["mcp-toolkit"].id },
  ]);

  console.log("Seed complete.");
  await pool.end();
}

function collaborationsTable() {
  // Lazy import to avoid circular reference issues during top-level execution in some envs.
  const { collaborations } = require("./schema");
  return collaborations;
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
