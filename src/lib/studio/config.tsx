/**
 * رجیستری بلوک‌های مجاز استودیو هادیران (Puck Config).
 * حاکمیت طراحی: هیچ فیلد رنگ/فونت آزادی نیست؛ فقط واریانت‌های سیستم طراحی.
 * همین Config هم در ادیتور و هم در رندر عمومی /p/[slug] استفاده می‌شود.
 */
import type { Config } from "@puckeditor/core";
import type { ReactNode } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { HomeChat } from "@/components/HomeChat";
import { HadiranMark } from "@/components/HadiranMark";
import { ReassemblyPortrait } from "@/components/portrait/ReassemblyPortrait";

type HeroProps = {
  kicker: string;
  title: string;
  lead: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  align: "start" | "center";
};

type HadiranHomeHeroProps = { kicker: string; title: string; lead: string; interactive?: boolean };
type SectionHeaderProps = { kicker: string; title: string; lead: string; align: "start" | "center" };
type RichTextProps = { body: string };
type BentoProps = { title: string; columns: "2" | "3"; items: { title: string; body: string }[] };
type FaqProps = { heading: string; items: { question: string; answer: string }[] };
type CtaProps = { title: string; lead: string; label: string; href: string };
type DividerProps = { space: "sm" | "md" | "lg" };
type SignInPanelProps = { heading: string; lead: string; nextPath?: string };
type AccountPanelProps = Record<string, never>;

function HadiranHomeHero({ kicker, title, lead, interactive }: HadiranHomeHeroProps) {
  return (
    <section className="page-hero">
      <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
      <div className="wrap home-hero-grid">
        <div className="home-hero-copy">
          {kicker ? <p className="eyebrow">{kicker}</p> : null}
          {title ? <h1 className="display mt-5 text-ink">{title}</h1> : null}
          {lead ? <p className="lede mt-4 max-w-xl">{lead}</p> : null}
          <p className="home-hero-note mt-6">
            <span className="home-status-dot" aria-hidden="true" />
            اول می‌بینیم، بعد می‌سازیم
          </p>
        </div>
        <div className="home-portrait-shell">
          <ReassemblyPortrait />
          <p className="home-portrait-brand">
            <HadiranMark className="h-7 w-7" />
            <span>هادیران</span>
          </p>
        </div>
      </div>
      <div className="wrap home-chat-wrap">
        {interactive ? (
          <HomeChat />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-6 text-sm leading-7 text-slate-600">
            گفت‌وگوی واقعی هادیران هنگام انتشار در این بخش نمایش داده می‌شود.
          </div>
        )}
      </div>
    </section>
  );
}

function FaqBlock({ heading, items }: FaqProps) {
  const visibleItems = items.filter((item) => item.question.trim() && item.answer.trim());
  if (!heading && visibleItems.length === 0) return null;
  return (
    <section className="py-8">
      {heading ? <h2 className="mb-4 text-2xl font-black text-slate-900">{heading}</h2> : null}
      <div className="space-y-3">
        {visibleItems.map((item, index) => (
          <details key={`${item.question}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer font-bold text-slate-900">{item.question}</summary>
            <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function AccountPanelPreview() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-slate-600">
      محتوای واقعی و شخصیِ حساب در این جایگاه رندر می‌شود؛ این بلوک خودش دادهٔ حساب را ذخیره نمی‌کند.
    </section>
  );
}

export type StudioLiveItem = { title: string; href: string; meta: string };
export type LiveListProps = {
  heading: string;
  topicSlug?: string;
  kind?: string;
  limit: "3" | "6" | "9";
  layout: "cards" | "list";
  items?: StudioLiveItem[];
};

function LiveList({ heading, layout, items }: LiveListProps) {
  const list = items ?? [];
  return (
    <section className="py-6">
      {heading ? <h2 className="mb-4 text-2xl font-black text-slate-900">{heading}</h2> : null}
      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          هنوز داده‌ای برای نمایش نیست.
        </p>
      ) : layout === "list" ? (
        <ul className="space-y-2">
          {list.map((item, i) => (
            <li key={i}>
              <a href={item.href} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200">
                <span className="font-bold text-slate-900">{item.title}</span>
                {item.meta ? <span className="mt-1 block text-sm leading-7 text-slate-600">{item.meta}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item, i) => (
            <a key={i} href={item.href} className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200">
              <span className="font-bold text-slate-900">{item.title}</span>
              {item.meta ? <span className="mt-1 block text-sm leading-7 text-slate-600">{item.meta}</span> : null}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

const liveFields = {
  heading: { type: "text", label: "عنوان بخش" },
  limit: {
    type: "select",
    label: "تعداد",
    options: [
      { label: "۳", value: "3" },
      { label: "۶", value: "6" },
      { label: "۹", value: "9" },
    ],
  },
  layout: {
    type: "select",
    label: "چیدمان",
    options: [
      { label: "کارت", value: "cards" },
      { label: "فهرست", value: "list" },
    ],
  },
} as const;

export const studioConfig: Config<{
  PageHero: HeroProps;
  HadiranHomeHero: HadiranHomeHeroProps;
  SectionHeader: SectionHeaderProps;
  RichText: RichTextProps;
  BentoGrid: BentoProps;
  FAQ: FaqProps;
  CTABand: CtaProps;
  Divider: DividerProps;
  KnowledgeList: LiveListProps;
  ProjectPipeline: LiveListProps;
  CourseGrid: LiveListProps;
  AnalyzerGrid: LiveListProps;
  TopicHub: LiveListProps;
  ShopGrid: LiveListProps;
  SignInPanel: SignInPanelProps;
  AccountPanel: AccountPanelProps;
}> = {
  root: {
    render: ({ children }) => (
      <main className="mx-auto w-full max-w-5xl px-4 py-10 text-slate-900">{children}</main>
    ),
  },
  categories: {
    structure: { title: "ساختار", components: ["PageHero", "HadiranHomeHero", "SectionHeader", "Divider"] },
    content: { title: "محتوا", components: ["RichText", "BentoGrid", "FAQ"] },
    conversion: { title: "تصمیم و تبدیل", components: ["CTABand"] },
    live: {
      title: "دادهٔ زندهٔ هادیران",
      components: ["KnowledgeList", "ProjectPipeline", "CourseGrid", "AnalyzerGrid", "TopicHub", "ShopGrid"],
    },
    system: { title: "بخش‌های سیستمی", components: ["SignInPanel", "AccountPanel"] },
  },
  components: {
    PageHero: {
      label: "سربرگ صفحه (Hero)",
      fields: {
        kicker: { type: "text", label: "برچسب بالای عنوان" },
        title: { type: "text", label: "عنوان" },
        lead: { type: "textarea", label: "متن معرفی" },
        primaryLabel: { type: "text", label: "دکمهٔ اصلی — متن" },
        primaryHref: { type: "text", label: "دکمهٔ اصلی — پیوند" },
        secondaryLabel: { type: "text", label: "دکمهٔ دوم — متن" },
        secondaryHref: { type: "text", label: "دکمهٔ دوم — پیوند" },
        align: {
          type: "radio",
          label: "تراز",
          options: [
            { label: "شروع", value: "start" },
            { label: "وسط", value: "center" },
          ],
        },
      },
      defaultProps: {
        kicker: "",
        title: "",
        lead: "",
        primaryLabel: "",
        primaryHref: "",
        secondaryLabel: "",
        secondaryHref: "",
        align: "start",
      },
      render: ({ kicker, title, lead, primaryLabel, primaryHref, secondaryLabel, secondaryHref, align }) => (
        <section className={align === "center" ? "py-10 text-center" : "py-10"}>
          {kicker ? <p className="text-sm font-bold text-indigo-700">{kicker}</p> : null}
          {title ? <h1 className="mt-2 text-3xl font-black leading-snug sm:text-4xl">{title}</h1> : null}
          {lead ? <p className="mt-4 leading-8 text-slate-600">{lead}</p> : null}
          {(primaryLabel || secondaryLabel) && (
            <div className={align === "center" ? "mt-6 flex flex-wrap justify-center gap-3" : "mt-6 flex flex-wrap gap-3"}>
              {primaryLabel && primaryHref ? (
                <a href={primaryHref} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">
                  {primaryLabel}
                </a>
              ) : null}
              {secondaryLabel && secondaryHref ? (
                <a href={secondaryHref} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700">
                  {secondaryLabel}
                </a>
              ) : null}
            </div>
          )}
        </section>
      ),
    },
    HadiranHomeHero: {
      label: "سربرگ خانهٔ هادیران (با گفت‌وگوی زنده)",
      fields: {
        kicker: { type: "text", label: "برچسب بالای عنوان" },
        title: { type: "text", label: "عنوان اصلی" },
        lead: { type: "textarea", label: "توضیح" },
      },
      defaultProps: { kicker: "", title: "", lead: "" },
      render: (props) => <HadiranHomeHero {...props} />,
    },
    SectionHeader: {
      label: "سربرگ بخش",
      fields: {
        kicker: { type: "text", label: "برچسب" },
        title: { type: "text", label: "عنوان بخش" },
        lead: { type: "textarea", label: "توضیح" },
        align: {
          type: "radio",
          label: "تراز",
          options: [
            { label: "شروع", value: "start" },
            { label: "وسط", value: "center" },
          ],
        },
      },
      defaultProps: { kicker: "", title: "", lead: "", align: "start" },
      render: ({ kicker, title, lead, align }) => (
        <header className={align === "center" ? "py-6 text-center" : "py-6"}>
          {kicker ? <p className="text-xs font-bold text-indigo-700">{kicker}</p> : null}
          {title ? <h2 className="mt-1 text-2xl font-black">{title}</h2> : null}
          {lead ? <p className="mt-2 leading-8 text-slate-600">{lead}</p> : null}
        </header>
      ),
    },
    RichText: {
      label: "متن ساده",
      fields: {
        body: { type: "textarea", label: "متن (پاراگراف‌ها با خط خالی جدا می‌شوند)" },
      },
      defaultProps: { body: "" },
      render: ({ body }) => (
        <div className="space-y-4 py-2 leading-8 text-slate-700">
          {(body ?? "")
            .split(/\n\s*\n/)
            .map((part) => part.trim())
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
        </div>
      ),
    },
    BentoGrid: {
      label: "شبکهٔ کارتی (Bento)",
      fields: {
        title: { type: "text", label: "عنوان شبکه" },
        columns: {
          type: "select",
          label: "ستون‌ها",
          options: [
            { label: "۲ ستون", value: "2" },
            { label: "۳ ستون", value: "3" },
          ],
        },
        items: {
          type: "array",
          label: "کارت‌ها",
          arrayFields: {
            title: { type: "text", label: "عنوان کارت" },
            body: { type: "textarea", label: "متن کارت" },
          },
          getItemSummary: (item) => item.title || "مورد جدید",
        },
      },
      defaultProps: { title: "", columns: "3", items: [] },
      render: ({ title, columns, items }) => (
        <section className="py-6">
          {title ? <h2 className="mb-4 text-2xl font-black">{title}</h2> : null}
          <div className={columns === "2" ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
            {(items ?? []).map((item, i) => (
              <article key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="font-bold">{item.title}</h3>
                {item.body ? <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ),
    },
    FAQ: {
      label: "پرسش‌های متداول",
      fields: {
        heading: { type: "text", label: "عنوان بخش" },
        items: {
          type: "array",
          label: "پرسش‌ها و پاسخ‌ها",
          arrayFields: {
            question: { type: "text", label: "پرسش" },
            answer: { type: "textarea", label: "پاسخ" },
          },
          getItemSummary: (item) => item.question || "پرسش تازه",
        },
      },
      defaultProps: { heading: "", items: [] },
      render: (props) => <FaqBlock {...props} />,
    },
    CTABand: {
      label: "نوار دعوت به اقدام (CTA)",
      fields: {
        title: { type: "text", label: "عنوان" },
        lead: { type: "textarea", label: "توضیح" },
        label: { type: "text", label: "متن دکمه" },
        href: { type: "text", label: "پیوند دکمه" },
      },
      defaultProps: { title: "", lead: "", label: "", href: "" },
      render: ({ title, lead, label, href }) => (
        <section className="my-8 rounded-3xl bg-slate-900 p-6 text-center text-white sm:p-10">
          {title ? <h2 className="text-2xl font-black">{title}</h2> : null}
          {lead ? <p className="mx-auto mt-3 max-w-2xl leading-8 text-slate-300">{lead}</p> : null}
          {label && href ? (
            <a href={href} className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-black text-slate-900">
              {label}
            </a>
          ) : null}
        </section>
      ),
    },
    KnowledgeList: {
      label: "فهرست دانش (زنده)",
      fields: {
        ...liveFields,
        topicSlug: { type: "text", label: "اسلاگ موضوع (اختیاری)" },
      },
      defaultProps: { heading: "", limit: "6", layout: "cards", topicSlug: "", items: [] },
      render: (props) => <LiveList {...props} />,
    },
    ProjectPipeline: {
      label: "پروژه‌های کارگاه (زنده)",
      fields: { ...liveFields },
      defaultProps: { heading: "", limit: "6", layout: "cards", items: [] },
      render: (props) => <LiveList {...props} />,
    },
    CourseGrid: {
      label: "دوره‌ها (زنده)",
      fields: { ...liveFields },
      defaultProps: { heading: "", limit: "6", layout: "cards", items: [] },
      render: (props) => <LiveList {...props} />,
    },
    AnalyzerGrid: {
      label: "آینه‌ها (زنده)",
      fields: { ...liveFields },
      defaultProps: { heading: "", limit: "6", layout: "cards", items: [] },
      render: (props) => <LiveList {...props} />,
    },
    TopicHub: {
      label: "موضوع‌ها (زنده)",
      fields: { ...liveFields },
      defaultProps: { heading: "", limit: "6", layout: "cards", items: [] },
      render: (props) => <LiveList {...props} />,
    },
    ShopGrid: {
      label: "فروشگاه (زنده)",
      fields: {
        ...liveFields,
        kind: { type: "text", label: "نوع کالا (اختیاری)" },
      },
      defaultProps: { heading: "", limit: "6", layout: "cards", kind: "", items: [] },
      render: (props) => <LiveList {...props} />,
    },
    SignInPanel: {
      label: "فرم ورود (سیستمی)",
      fields: {
        heading: { type: "text", label: "عنوان بالای فرم" },
        lead: { type: "textarea", label: "توضیح بالای فرم" },
      },
      defaultProps: { heading: "ورود با موبایل", lead: "" },
      render: ({ heading, lead, nextPath }) => (
        <section className="mx-auto max-w-md py-10">
          {heading ? <h1 className="text-3xl font-extrabold leading-snug text-slate-900">{heading}</h1> : null}
          {lead ? <p className="mb-6 mt-2 text-sm leading-7 text-slate-600">{lead}</p> : null}
          <SignInForm nextPath={nextPath || "/"} />
        </section>
      ),
    },
    AccountPanel: {
      label: "حساب واقعی (سیستمی)",
      fields: {},
      defaultProps: {},
      render: () => <AccountPanelPreview />,
    },
    Divider: {
      label: "فاصله‌گذار",
      fields: {
        space: {
          type: "select",
          label: "اندازهٔ فاصله",
          options: [
            { label: "کم", value: "sm" },
            { label: "متوسط", value: "md" },
            { label: "زیاد", value: "lg" },
          ],
        },
      },
      defaultProps: { space: "md" },
      render: ({ space }) => <div aria-hidden className={space === "sm" ? "h-4" : space === "lg" ? "h-16" : "h-8"} />,
    },
  },
};

/** بلوک‌های سیستمی فقط در صفحهٔ متناظرشان در کتابخانهٔ ادیتور نمایش داده می‌شوند. */
export function studioConfigForTarget(target: string): typeof studioConfig {
  const visible = new Set<string>([
    ...(target === "site:home" ? ["HadiranHomeHero"] : []),
    ...(target === "site:signin" ? ["SignInPanel"] : []),
    ...(target === "site:account" ? ["AccountPanel"] : []),
  ]);
  const hiddenSystem = new Set(["HadiranHomeHero", "SignInPanel", "AccountPanel"]);
  if (["site:home", "site:signin", "site:account"].includes(target)) hiddenSystem.add("PageHero");
  const components = Object.fromEntries(
    Object.entries(studioConfig.components).filter(([name]) => !hiddenSystem.has(name) || visible.has(name)),
  );
  const categories = Object.fromEntries(
    Object.entries(studioConfig.categories ?? {}).map(([name, category]) => [
      name,
      { ...category, components: (category.components ?? []).filter((component) => !hiddenSystem.has(component) || visible.has(component)) },
    ]),
  );
  return { ...studioConfig, components, categories } as typeof studioConfig;
}

/** خروجی عمومی برای جایگذاری امنِ محتوای سروریِ حساب در بلوک AccountPanel. */
export function studioRenderConfig(accountPanel?: ReactNode): typeof studioConfig {
  if (!accountPanel) return studioConfig;
  return {
    ...studioConfig,
    components: {
      ...studioConfig.components,
      AccountPanel: {
        ...studioConfig.components.AccountPanel,
        render: () => <>{accountPanel}</>,
      },
    },
  };
}
