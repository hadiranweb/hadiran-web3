import type { SiteCopy } from "@/lib/content/registry";
import { privacyDetails, privacySummary, privacyUseTerms } from "@/lib/privacy/content";
import type { StudioData, StudioBlockType } from "./validate";

type Block = StudioData["content"][number];

const block = (type: StudioBlockType, props: Record<string, unknown> = {}): Block => ({ type, props });

function pageHero(title: string, lead = "", kicker = ""): Block {
  return block("PageHero", {
    kicker,
    title,
    lead,
    primaryLabel: "",
    primaryHref: "",
    secondaryLabel: "",
    secondaryHref: "",
    align: "start",
  });
}

function liveList(type: StudioBlockType, heading = ""): Block {
  return block(type, { heading, limit: "all", layout: "cards" });
}

function paragraphs(lines: string[]): string {
  return lines.filter(Boolean).join("\n\n");
}

/**
 * تبدیلِ محتوای واقعیِ صفحات کدی به draft ساختاریافتهٔ Puck.
 * این عمداً از HTML/DOM scrape نمی‌کند: متن از همان SiteCopy و داده‌های واقعی می‌آید؛
 * بخش‌های DBمحور به live block می‌روند تا در JSON استودیو snapshot/seed نشوند.
 */
export function sitePageSeedData(key: string, copy: SiteCopy, fallbackTitle?: string): StudioData {
  let content: Block[];
  switch (key) {
    case "home":
      content = [
        block("HadiranHomeHero", {
          kicker: copy.voice.distinction,
          title: copy.voice.slogan,
          lead: copy.voice.subSlogan,
          roomsLine: copy.voice.roomsLine,
          brandName: copy.site.nameFa,
        }),
        block("HomeMarquee", {
          items: [copy.rooms.house, copy.rooms.knowledge, copy.rooms.lab, copy.rooms.mirrors, copy.rooms.courses, copy.rooms.shop]
            .map((room) => ({ label: room.label })),
        }),
        block("HomeFlow", {
          kicker: copy.homeFlow.kicker,
          title: copy.homeFlow.title,
          lead: copy.homeFlow.lede,
          items: copy.homeFlow.steps.map((step) => ({ n: step.n, title: step.title, body: step.body })),
        }),
        block("HomeRooms", {
          kicker: "اتاق‌ها",
          title: "یک خانه، چند در",
          mapLabel: "نقشهٔ خانه",
          mapHref: copy.rooms.house.href,
          items: [
            copy.rooms.knowledge,
            copy.rooms.lab,
            copy.rooms.mirrors,
            copy.rooms.courses,
            copy.rooms.shop,
            copy.rooms.person,
          ].map((room) => ({ label: room.label, href: room.href })),
        }),
      ];
      break;
    case "ecosystem":
      content = [
        pageHero(copy.houseCopy.heading, copy.houseCopy.lede, "نقشه"),
        block("EcosystemGrid"),
        block("BentoGrid", {
          title: "",
          columns: "2",
          items: [
            { title: "شروع هم‌فکری", body: "", href: "/" },
            { title: "درباره من", body: "", href: copy.rooms.person.href },
          ],
        }),
      ];
      break;
    case "knowledge":
      content = [pageHero(copy.knowledgeCopy.title, copy.knowledgeCopy.lede), liveList("KnowledgeList")];
      break;
    case "analyzers":
      content = [pageHero(copy.mirrorsCopy.title, copy.mirrorsCopy.lede), liveList("AnalyzerGrid")];
      break;
    case "lab":
      content = [pageHero(copy.labCopy.title, copy.labCopy.lede), liveList("ProjectPipeline")];
      break;
    case "courses":
      content = [
        pageHero("دوره‌ها", "آموزش در هادیران؛ تا دورهٔ واقعی نیاید فهرست خالی می‌ماند."),
        liveList("CourseGrid"),
      ];
      break;
    case "shop":
      content = [
        pageHero(
          "فروشگاه",
          "کالاهای فیزیکی (محصول، مُهر، باکس آموزشی) و مجازی (دوره). پرداخت روی ریل بیرونی است؛ سایت پول را نگه نمی‌دارد.",
        ),
        liveList("ShopGrid"),
      ];
      break;
    case "topics":
      content = [
        pageHero("موضوعات", "پل خانه: هر موضوع باغ دانش، ظرف کارگاه و دورهٔ مرتبط را در یک صفحه جمع می‌کند."),
        liveList("TopicHub"),
      ];
      break;
    case "person":
      content = [
        block("PersonPage", {
          fallbackName: "هادی",
          fallbackKicker: copy.voice.altTitle,
          intro: paragraphs(copy.personCopy.intro),
          missingText: copy.personCopy.missing,
        }),
      ];
      break;
    case "contact":
      content = [
        pageHero("راه‌های تماس", "این صفحه فقط روش‌های ارتباط است، نه بیوگرافی و نه فرم همکاری.", copy.site.nameFa),
        block("ContactMethods", { emptyText: copy.contactCopy.empty }),
        block("BentoGrid", {
          title: "",
          columns: "2",
          items: [
            { title: "درباره من", body: "", href: copy.rooms.person.href },
            { title: "همکاری از کارگاه", body: "", href: copy.rooms.lab.href },
          ],
        }),
      ];
      break;
    case "privacy":
      content = [
        pageHero("حریم خصوصی"),
        block("SectionHeader", { kicker: "", title: "خلاصه", lead: "", align: "start" }),
        block("RichText", { body: privacySummary }),
        block("SectionHeader", { kicker: "", title: "شرایط استفاده", lead: "", align: "start" }),
        block("RichText", { body: paragraphs(privacyUseTerms), mode: "bullets" }),
        block("SectionHeader", { kicker: "", title: "جزئیات", lead: "", align: "start" }),
        block("RichText", { body: paragraphs(privacyDetails), mode: "bullets" }),
      ];
      break;
    case "signin":
      content = [
        block("SignInPanel", {
          heading: "ورود با موبایل",
          lead: "شماره را بگذار. اگر رمز ثابت دارید همان را می‌خواهیم؛ وگرنه یک کد پیامکی می‌آید. گذاشتن رمز هنگام ثبت‌نام لازم نیست.",
        }),
      ];
      break;
    case "account":
      content = [block("AccountPanel")];
      break;
    default:
      content = [
        pageHero(fallbackTitle?.trim() || "صفحهٔ تازه"),
        block("RichText", { body: "" }),
      ];
  }
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40) || "site";
  return {
    content: content.map((entry, index) => ({
      ...entry,
      props: { ...entry.props, id: `${safeKey}-${index + 1}` },
    })),
    root: { props: { title: "" } },
  };
}

/** الگوی آغاز برای صفحهٔ مستقل جدید: عنوان واقعی، متن خالیِ قابل ویرایش، بدون محتوای ساختگی. */
export function standalonePageSeedData(titleFa: string): StudioData {
  const content = [pageHero(titleFa.trim() || "صفحهٔ تازه"), block("RichText", { body: "" })];
  return {
    content: content.map((entry, index) => ({ ...entry, props: { ...entry.props, id: `standalone-${index + 1}` } })),
    root: { props: { title: "" } },
  };
}
