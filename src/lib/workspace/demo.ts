import type { WorkspaceItem } from "./types";
export const demoKnowledge: WorkspaceItem[] = [
  { id: "k-1", title: "اصول تحلیل معماری سیستم", titleEn: "Principles of system architecture", category: "article", status: "sample", detail: "از مرزهای سیستم تا تصمیم‌های معماری؛ چارچوبی برای شروع تحلیل.", updated: "2026-10-16", slug: "system-architecture", body: "## از مسئله شروع کنیم\nپیش از انتخاب ابزار، مرزها، نیازها و فرض‌های سیستم را مشخص کنید." },
  { id: "k-2", title: "طراحی مسیر یادگیری", titleEn: "Designing a learning path", category: "note", status: "sample", detail: "پیوند دادن سؤال، تمرین و پروژه در مسیر یادگیری.", updated: "2026-10-15", slug: "learning-path", body: "هدف یادگیری را به یک پروژهٔ کوچک و قابل ارزیابی پیوند دهید." },
  { id: "k-3", title: "فرض‌های پنهان در تصمیم‌گیری", titleEn: "Hidden assumptions in decisions", category: "research", status: "sample", detail: "چگونه فرض‌های پنهان را به پرسش‌های قابل بررسی تبدیل کنیم؟", updated: "2026-10-14", slug: "hidden-assumptions", body: "هر تصمیم بر فرض‌هایی تکیه می‌کند. آن‌ها را پیش از اجرا مستند کنید." },
  { id: "k-4", title: "دفترچه ایده‌های محصول", titleEn: "Product ideas notebook", category: "idea", status: "sample", detail: "ثبت ایده‌ها بدون عجله برای تبدیل آن‌ها به محصول.", updated: "2026-10-12", slug: "product-ideas", body: "ایده را با مسئله، مخاطب و راه آزمودن آن ثبت کنید." },
];
export const demoProjects: WorkspaceItem[] = [
  { id: "p-1", title: "معماری دانش هادیران", titleEn: "Hadiran knowledge architecture", category: "platform", status: "development", detail: "یک ساختار پیوسته برای دانش، پروژه و مسیر یادگیری.", updated: "2026-10-16", progress: 65 },
  { id: "p-2", title: "دستیار هم‌فکری", titleEn: "Thinking partner", category: "ai", status: "prototype", detail: "آزمودن گفتگو به‌عنوان ابزاری برای روشن‌کردن مسئله.", updated: "2026-10-15", progress: 35 },
  { id: "p-3", title: "نقشه مسیرهای یادگیری", titleEn: "Learning pathways", category: "education", status: "research", detail: "بررسی پیوند مهارت‌ها، موضوع‌ها و تمرین‌ها.", updated: "2026-10-13", progress: 15 },
];
export const demoCollaborations: WorkspaceItem[] = [
  { id: "c-1", title: "متقاضی نمونه اول", titleEn: "Sample applicant one", category: "معماری دانش هادیران", status: "submitted", detail: "مایلم در بررسی ساختار اطلاعات و تجربهٔ جست‌وجوی دانش مشارکت کنم.", updated: "2026-10-16", email: "sample-one@example.com" },
  { id: "c-2", title: "متقاضی نمونه دوم", titleEn: "Sample applicant two", category: "دستیار هم‌فکری", status: "reviewed", detail: "برای ارزیابی کیفیت پاسخ‌ها و طراحی سناریوهای گفتگو آماده‌ام.", updated: "2026-10-15", email: "sample-two@example.com" },
];
export const demoProducts: WorkspaceItem[] = [
  { id: "product-1", title: "راهنمای شفاف‌سازی مسئله", titleEn: "Problem clarification guide", category: "PDF", status: "draft", detail: "چارچوبی کوتاه برای تبدیل ابهام به مسئله‌ای قابل بررسی.", updated: "2026-10-16", slug: "problem-clarification", price: "0" },
  { id: "product-2", title: "الگوی معماری سیستم", titleEn: "System architecture template", category: "Template", status: "ready", detail: "قالبی برای ثبت مرزها، نیازها و تصمیم‌های یک سیستم.", updated: "2026-10-14", slug: "system-template", price: "250000" },
];
