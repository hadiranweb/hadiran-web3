/**
 * رجیستری بلوک‌های مجاز استودیو هادیران (Puck Config).
 * حاکمیت طراحی: هیچ فیلد رنگ/فونت آزادی نیست؛ فقط واریانت‌های سیستم طراحی.
 * همین Config هم در ادیتور و هم در رندر عمومی /p/[slug] استفاده می‌شود.
 */
import type { Config } from "@puckeditor/core";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SignInForm } from "@/components/auth/SignInForm";
import { HomeChat } from "@/components/HomeChat";
import { HadiranMark } from "@/components/HadiranMark";
import { ReassemblyPortrait } from "@/components/portrait/ReassemblyPortrait";
import { CollectionChips, CollectionSearch } from "@/components/ui/CollectionControls";
import { PageHeader } from "@/components/ui/PageHeader";

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

type HadiranHomeHeroProps = {
  kicker: string;
  title: string;
  lead: string;
  roomsLine: string;
  brandName: string;
  interactive?: boolean;
  portraitSlot?: ReactNode;
};
type HomeMarqueeProps = { items: { label: string }[] };
type HomeFlowProps = {
  kicker: string;
  title: string;
  lead: string;
  items: { n: string; title: string; body: string }[];
};
type HomeRoomsProps = {
  kicker: string;
  title: string;
  mapLabel: string;
  mapHref: string;
  items: { label: string; href: string }[];
};
type SectionHeaderProps = { kicker: string; title: string; lead: string; align: "start" | "center" };
type RichTextProps = { body: string; mode?: "paragraphs" | "bullets" };
type BentoProps = {
  title: string;
  columns: "2" | "3";
  items: { title: string; body: string; badge?: string; href?: string }[];
};
type FaqProps = { heading: string; items: { question: string; answer: string }[] };
type PersonDetailsData = {
  avatarUrl?: string | null;
  nameFa: string;
  nameEn?: string | null;
  perspectiveFa?: string | null;
  topics: { labelFa: string; slug: string }[];
  skills: { labelFa: string }[];
  organizations: { nameFa: string; roleFa?: string | null; url?: string | null }[];
  contacts: { label: string; value: string; url?: string }[];
};
type PersonPageProps = {
  fallbackName: string;
  fallbackKicker: string;
  intro: string;
  missingText: string;
  profile?: PersonDetailsData | null;
  source?: "live" | "unavailable" | "error";
};
type ContactMethodData = { label: string; value: string; url?: string };
type LiveControls = {
  action: string;
  q: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
  groups?: { label?: string; links: { href: string; label: string; active?: boolean }[] }[];
};
type CtaProps = { title: string; lead: string; label: string; href: string };
type DividerProps = { space: "sm" | "md" | "lg" };
type SignInPanelProps = { heading: string; lead: string; nextPath?: string };
type AccountPanelProps = Record<string, never>;

function HadiranHomeHero({ kicker, title, lead, roomsLine, brandName, interactive, portraitSlot }: HadiranHomeHeroProps) {
  return (
    <section className="page-hero">
      <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
      <div className="wrap home-hero-grid">
        <div className="home-hero-copy">
          {kicker ? <p className="eyebrow">{kicker}</p> : null}
          {title ? <h1 className="display mt-5 text-ink">{title}</h1> : null}
          {lead ? <p className="lede mt-4 max-w-xl">{lead}</p> : null}
          {roomsLine ? <p className="mt-3 max-w-xl text-sm leading-7 text-muted">{roomsLine}</p> : null}
          <p className="home-hero-note mt-6">
            <span className="home-status-dot" aria-hidden="true" />
            اول می‌بینیم، بعد می‌سازیم
          </p>
        </div>
        <div className="home-portrait-shell">
          {portraitSlot ?? <ReassemblyPortrait />}
          <p className="home-portrait-brand">
            <HadiranMark className="h-7 w-7" />
            <span>{brandName || "هادیران"}</span>
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

function HomeMarqueeBlock({ items }: HomeMarqueeProps) {
  const visibleItems = items.filter((item) => item.label.trim());
  if (!visibleItems.length) return null;
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((tile) => (
          <p key={tile} className="marquee-item">
            {visibleItems.map((item, index) => (
              <span key={`${item.label}-${index}`}>
                {item.label}
                <span className="marquee-symbol"> · </span>
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}

function HomeFlowBlock({ kicker, title, lead, items }: HomeFlowProps) {
  return (
    <section className="conversation-flow">
      <div className="wrap">
        <div className="section-heading">
          {kicker ? <p className="eyebrow">{kicker}</p> : null}
          {title ? <h2 className="title-xl mt-4 text-ink">{title}</h2> : null}
          {lead ? <p className="lede mt-3">{lead}</p> : null}
        </div>
        <ol className="flow-list">
          {items.map((item, index) => (
            <li key={`${item.n}-${index}`} className="flow-item">
              <span className="flow-number">{item.n}</span>
              <div>
                {item.title ? <h3 className="title-lg text-ink">{item.title}</h3> : null}
                {item.body ? <p className="lede mt-2">{item.body}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function HomeRoomsBlock({ kicker, title, mapLabel, mapHref, items }: HomeRoomsProps) {
  const safeMapHref = safeDisplayHref(mapHref);
  return (
    <section className="home-sections">
      <div className="wrap">
        <div className="section-heading-row">
          <div>
            {kicker ? <p className="eyebrow">{kicker}</p> : null}
            {title ? <h2 className="title-xl mt-3 text-ink">{title}</h2> : null}
          </div>
          {mapLabel && safeMapHref ? (
            <Link href={safeMapHref} className="more">
              {mapLabel}
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          ) : null}
        </div>
        <ul className="section-cards">
          {items.map((item, index) => {
            const href = safeDisplayHref(item.href);
            const content = (
              <>
                <div className="section-card-copy">
                  <span className="tile" aria-hidden="true">{item.label.slice(0, 1)}</span>
                  <h3 className="section-card-title mt-3">{item.label}</h3>
                </div>
                <span className="more">
                  ورود
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                </span>
              </>
            );
            return (
              <li key={`${item.href}-${index}`}>
                {href ? (
                  <Link href={href} className="card card-hover section-card">{content}</Link>
                ) : (
                  <article className="card section-card">{content}</article>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function FaqBlock({ heading, items }: FaqProps) {
  const visibleItems = items.filter((item) => item.question.trim() && item.answer.trim());
  if (!heading && visibleItems.length === 0) return null;
  return (
    <section className="wrap py-8">
      {heading ? <h2 className="title-lg mb-4 text-ink">{heading}</h2> : null}
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
    <section className="wrap mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-slate-600">
      محتوای واقعی و شخصیِ حساب در این جایگاه رندر می‌شود؛ این بلوک خودش دادهٔ حساب را ذخیره نمی‌کند.
    </section>
  );
}

function safeDisplayHref(value: string | null | undefined): string | undefined {
  if (!value || /[\\\u0000-\u001f\u007f]/.test(value)) return undefined;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^(mailto:|tel:)/i.test(value)) return value;
  try {
    const parsed = new URL(value);
    if (["https:", "http:"].includes(parsed.protocol) && parsed.hostname && !parsed.username && !parsed.password) {
      return parsed.href;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function PersonProfileSections({ profile }: { profile: PersonDetailsData }) {
  return (
    <>
      {profile.perspectiveFa ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">دیدگاه</h2>
          <p className="rounded-2xl bg-paper p-4 text-sm leading-8 text-ink">{profile.perspectiveFa}</p>
        </section>
      ) : null}
      {profile.topics.length ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">موضوعات</h2>
          <div className="flex flex-wrap gap-2">
            {profile.topics.map((topic) => (
              <Link key={topic.slug} href={`/topics/${encodeURIComponent(topic.slug)}`} className="chip">{topic.labelFa}</Link>
            ))}
          </div>
        </section>
      ) : null}
      {profile.skills.length ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">مهارت‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => <span key={`${skill.labelFa}-${index}`} className="chip">{skill.labelFa}</span>)}
          </div>
        </section>
      ) : null}
      {profile.organizations.length ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">سازمان‌ها و نقش‌ها</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {profile.organizations.map((organization, index) => {
              const href = safeDisplayHref(organization.url);
              const content = <><span className="font-semibold text-ink">{organization.nameFa}</span>{organization.roleFa ? <span className="mt-1 block text-sm text-muted">{organization.roleFa}</span> : null}</>;
              return <li key={`${organization.nameFa}-${index}`} className="rounded-2xl border border-line p-4">{href ? <a href={href} target="_blank" rel="noreferrer">{content}</a> : content}</li>;
            })}
          </ul>
        </section>
      ) : null}
      {profile.contacts.length ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">تماس</h2>
          <div className="flex flex-wrap gap-3">
            {profile.contacts.map((method, index) => {
              const href = safeDisplayHref(method.url);
              const label = `${method.label}: ${method.value}`;
              return href ? <a key={`${method.label}-${index}`} href={href} className="ws-button">{label}</a> : <span key={`${method.label}-${index}`} className="chip">{label}</span>;
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}

function sourceNotice(source?: "live" | "unavailable" | "error") {
  if (!source || source === "live") return null;
  return (
    <p className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
      {source === "unavailable" ? "اتصال به منبع برقرار نیست؛ این به‌معنای خالی بودن نیست." : "خواندن داده الان ممکن نیست؛ این به‌معنای خالی بودن نیست."}
    </p>
  );
}

function PersonDetailsBlock({ profile, source }: { profile?: PersonDetailsData | null; source?: "live" | "unavailable" | "error" }) {
  if (!profile) {
    if (!source || source === "live") return null;
    return <div className="wrap mx-auto max-w-3xl py-4">{sourceNotice(source)}</div>;
  }
  const avatarUrl = safeDisplayHref(profile.avatarUrl);
  return (
    <section className="wrap mx-auto max-w-3xl surface space-y-8 p-6 sm:p-10">
      <div className="mb-8 flex items-center gap-5">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-24 w-24 rounded-2xl object-cover" />
        ) : <HadiranMark className="h-24 w-24" />}
        <div>
          <p className="text-sm font-medium text-mark">شخص</p>
          <h2 className="text-2xl font-bold text-ink">{profile.nameFa}</h2>
          {profile.nameEn ? <p dir="ltr" className="mt-1 text-sm text-muted">{profile.nameEn}</p> : null}
        </div>
      </div>
      <PersonProfileSections profile={profile} />
    </section>
  );
}

function PersonPageBlock({
  fallbackName,
  fallbackKicker,
  intro,
  missingText,
  profile,
  source,
}: PersonPageProps) {
  if (!profile) {
    return (
      <section className="wrap mx-auto max-w-3xl py-10">
        <p className="text-sm font-medium text-mark">{fallbackKicker}</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">{fallbackName}</h1>
        <p className="mt-4 max-w-3xl text-base leading-[1.85] text-ink">{missingText}</p>
        {sourceNotice(source)}
      </section>
    );
  }
  const avatarUrl = safeDisplayHref(profile.avatarUrl);
  const paragraphs = intro.split(/\n\s*\n/).map((line) => line.trim()).filter(Boolean);
  return (
    <section className="wrap mx-auto max-w-3xl py-10">
      <article className="surface p-6 sm:p-10">
        <div className="mb-8 flex items-center gap-5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-24 w-24 rounded-[var(--radius-lg)] object-cover" />
          ) : <HadiranMark className="h-24 w-24" />}
          <div>
            <p className="text-sm font-medium text-mark">شخص</p>
            <h1 className="text-3xl font-extrabold leading-[1.35] text-ink">{profile.nameFa}</h1>
            {profile.nameEn ? <p className="mt-1 text-sm text-muted" dir="ltr">{profile.nameEn}</p> : null}
          </div>
        </div>
        <div className="max-w-3xl space-y-4 text-base leading-[1.85] text-ink">
          {paragraphs.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
        </div>
        <PersonProfileSections profile={profile} />
        <p className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
          <Link href="/contact" className="text-accent">صفحهٔ تماس</Link>
          <Link href="/privacy" className="text-accent">حریم خصوصی</Link>
        </p>
      </article>
    </section>
  );
}
function ContactMethodsBlock({ emptyText, methods = [], source }: { emptyText: string; methods?: ContactMethodData[]; source?: "live" | "unavailable" | "error" }) {
  const emptyParts = emptyText.split("گفتگو");
  return (
    <section className="wrap mx-auto max-w-3xl surface p-6 sm:p-10">
      {source && source !== "live" ? (
        <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm leading-7 text-amber-900">
          {source === "unavailable" ? "اتصال به منبع برقرار نیست؛ این به‌معنای خالی بودن نیست." : "خواندن داده الان ممکن نیست؛ این به‌معنای خالی بودن نیست."}
        </p>
      ) : null}
      {methods.length === 0 ? (
        <p className="text-sm leading-7 text-muted">
          {emptyParts.length > 1 ? <>{emptyParts[0]}<Link href="/" className="text-accent">گفتگو</Link>{emptyParts.slice(1).join("گفتگو")}</> : emptyText}
        </p>
      ) : (
        <ul className="space-y-3">
          {methods.map((method, index) => {
            const href = safeDisplayHref(method.url);
            const content = <><span className="text-xs font-medium text-muted">{method.label}</span><span className="mt-1 block text-base font-semibold text-ink">{method.value}</span></>;
            return <li key={`${method.label}-${index}`}>{href ? <a href={href} className="block rounded-2xl border border-line bg-paper px-4 py-3">{content}</a> : <div className="rounded-2xl border border-line bg-paper px-4 py-3">{content}</div>}</li>;
          })}
        </ul>
      )}
    </section>
  );
}

export type StudioLiveItem = {
  title: string;
  href?: string;
  meta: string;
  badge?: string;
  action?: string;
  tags?: string[];
  progress?: number;
  imageUrl?: string;
  price?: string;
  comparePrice?: string;
};
export type LiveListProps = {
  heading: string;
  topicSlug?: string;
  kind?: string;
  limit: "3" | "6" | "9" | "all";
  layout: "cards" | "list";
  items?: StudioLiveItem[];
  controls?: LiveControls;
  liveSource?: "live" | "unavailable" | "error";
  hasActiveFilter?: boolean;
  emptyMessage?: string;
  filteredEmptyMessage?: string;
  ownerAction?: ReactNode;
};

function LiveList({ heading, layout, items, controls, liveSource, hasActiveFilter, emptyMessage, filteredEmptyMessage, ownerAction }: LiveListProps) {
  const list = items ?? [];
  const cards = list.map((item, i) => {
    const imageUrl = safeDisplayHref(item.imageUrl);
    const progress = typeof item.progress === "number" ? Math.min(100, Math.max(0, item.progress)) : null;
    const content = (
      <>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-44 w-full object-cover" />
        ) : null}
        <div className="section-card-copy">
          {item.badge ? <span className="chip mb-2 inline-flex">{item.badge}</span> : null}
          <h2 className="section-card-title mt-2">{item.title}</h2>
          {item.meta ? <p className="muted mt-2 line-clamp-3 whitespace-pre-line text-sm leading-7">{item.meta}</p> : null}
          {item.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((tag, index) => <span key={`${tag}-${index}`} className="chip">{tag}</span>)}
            </div>
          ) : null}
          {progress !== null ? (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span>پیشرفت</span>
                <span>{progress.toLocaleString("fa-IR")}٪</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper">
                <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
          {item.price ? (
            <p className="mt-4 text-sm font-medium text-ink">
              {item.comparePrice ? <span className="ml-2 text-muted line-through">{item.comparePrice}</span> : null}
              {item.price}
            </p>
          ) : null}
        </div>
        {item.href && item.action ? (
          <span className="more">
            {item.action}
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </span>
        ) : null}
      </>
    );
    return (
      <li key={`${item.href ?? item.title}-${i}`}>
        {item.href ? (
          <Link href={item.href} className="card card-hover section-card overflow-hidden p-0">{content}</Link>
        ) : (
          <article className="card section-card overflow-hidden p-0">{content}</article>
        )}
      </li>
    );
  });
  let emptyText = emptyMessage || "هنوز داده‌ای برای نمایش نیست.";
  if (liveSource === "unavailable") emptyText = "منبع داده فعلاً در دسترس نیست.";
  else if (liveSource === "error") emptyText = "خواندن داده با خطا روبه‌رو شد.";
  else if (hasActiveFilter) emptyText = filteredEmptyMessage || "با این صافی موردی برای نمایش نیست.";

  return (
    <section className="wrap py-6">
      {heading || ownerAction ? (
        <div className="section-heading-row mb-4">
          {heading ? <h2 className="title-lg text-ink">{heading}</h2> : <span />}
          {ownerAction}
        </div>
      ) : null}
      {controls?.action ? (
        <>
          <CollectionSearch
            action={controls.action}
            q={controls.q}
            placeholder={controls.placeholder}
            hidden={controls.hidden}
          />
          {controls.groups?.map((group, index) => (
            <CollectionChips key={`${group.label ?? "filters"}-${index}`} label={group.label} links={group.links} />
          ))}
        </>
      ) : null}
      {list.length === 0 ? (
        <div className="surface p-6 text-sm leading-7 text-muted">{emptyText}</div>
      ) : (
        <ul className={layout === "list" ? "section-cards listing-cards is-compact" : "section-cards listing-cards"}>{cards}</ul>
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
      { label: "همه", value: "all" },
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
  HomeMarquee: HomeMarqueeProps;
  HomeFlow: HomeFlowProps;
  HomeRooms: HomeRoomsProps;
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
  EcosystemGrid: { heading: string; items?: StudioLiveItem[] };
  PersonDetails: { profile?: PersonDetailsData | null; source?: "live" | "unavailable" | "error" };
  PersonPage: PersonPageProps;
  ContactMethods: { emptyText: string; methods?: ContactMethodData[]; source?: "live" | "unavailable" | "error" };
}> = {
  root: {
    render: ({ children }) => <main className="module-page">{children}</main>,
  },
  categories: {
    structure: { title: "ساختار", components: ["PageHero", "HadiranHomeHero", "HomeMarquee", "HomeFlow", "HomeRooms", "SectionHeader", "Divider"] },
    content: { title: "محتوا", components: ["RichText", "BentoGrid", "FAQ"] },
    conversion: { title: "تصمیم و تبدیل", components: ["CTABand"] },
    live: {
      title: "دادهٔ زندهٔ هادیران",
      components: ["KnowledgeList", "ProjectPipeline", "CourseGrid", "AnalyzerGrid", "TopicHub", "ShopGrid", "EcosystemGrid", "PersonDetails", "PersonPage", "ContactMethods"],
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
        <section className="page-hero page-hero-compact">
          <div className="aurora" aria-hidden="true"><span /><span /><span /></div>
          <div className="wrap">
            <PageHeader kicker={kicker} title={title} lede={lead} align={align}>
              {(primaryLabel || secondaryLabel) ? (
                <div className={align === "center" ? "mt-6 flex flex-wrap justify-center gap-3" : "mt-6 flex flex-wrap gap-3"}>
                  {primaryLabel && primaryHref ? (
                    <a href={primaryHref} className="ws-button ws-primary">{primaryLabel}</a>
                  ) : null}
                  {secondaryLabel && secondaryHref ? <a href={secondaryHref} className="ws-button">{secondaryLabel}</a> : null}
                </div>
              ) : null}
            </PageHeader>
          </div>
        </section>
      ),
    },
    HadiranHomeHero: {
      label: "سربرگ خانهٔ هادیران (با گفت‌وگوی زنده)",
      fields: {
        kicker: { type: "text", label: "برچسب بالای عنوان" },
        title: { type: "text", label: "عنوان اصلی" },
        lead: { type: "textarea", label: "زیرشعار" },
        roomsLine: { type: "textarea", label: "خط معرفی اتاق‌ها" },
        brandName: { type: "text", label: "نام برند کنار نشان" },
      },
      defaultProps: { kicker: "", title: "", lead: "", roomsLine: "", brandName: "هادیران" },
      render: (props) => <HadiranHomeHero {...props} />,
    },
    HomeMarquee: {
      label: "نوار اتاق‌های خانه",
      fields: {
        items: {
          type: "array",
          label: "نام اتاق‌ها",
          arrayFields: { label: { type: "text", label: "نام اتاق" } },
          getItemSummary: (item) => item.label || "اتاق",
        },
      },
      defaultProps: { items: [] },
      render: ({ items }) => <HomeMarqueeBlock items={items ?? []} />,
    },
    HomeFlow: {
      label: "جریان گفت‌وگو و ساخت",
      fields: {
        kicker: { type: "text", label: "برچسب" },
        title: { type: "text", label: "عنوان" },
        lead: { type: "textarea", label: "توضیح" },
        items: {
          type: "array",
          label: "گام‌ها",
          arrayFields: {
            n: { type: "text", label: "شماره" },
            title: { type: "text", label: "عنوان گام" },
            body: { type: "textarea", label: "توضیح گام" },
          },
          getItemSummary: (item) => item.title || "گام تازه",
        },
      },
      defaultProps: { kicker: "", title: "", lead: "", items: [] },
      render: (props) => <HomeFlowBlock {...props} />,
    },
    HomeRooms: {
      label: "کارت‌های اتاق خانه",
      fields: {
        kicker: { type: "text", label: "برچسب" },
        title: { type: "text", label: "عنوان" },
        mapLabel: { type: "text", label: "متن پیوند نقشه" },
        mapHref: { type: "text", label: "پیوند نقشه" },
        items: {
          type: "array",
          label: "اتاق‌ها",
          arrayFields: {
            label: { type: "text", label: "نام اتاق" },
            href: { type: "text", label: "پیوند اتاق" },
          },
          getItemSummary: (item) => item.label || "اتاق تازه",
        },
      },
      defaultProps: { kicker: "اتاق‌ها", title: "یک خانه، چند در", mapLabel: "نقشهٔ خانه", mapHref: "/ecosystem", items: [] },
      render: (props) => <HomeRoomsBlock {...props} />,
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
        <header className={`wrap py-6 ${align === "center" ? "text-center" : ""}`}>
          {kicker ? <p className="eyebrow">{kicker}</p> : null}
          {title ? <h2 className="title-lg mt-2 text-ink">{title}</h2> : null}
          {lead ? <p className="lede mt-2">{lead}</p> : null}
        </header>
      ),
    },
    RichText: {
      label: "متن ساده",
      fields: {
        body: { type: "textarea", label: "متن (پاراگراف‌ها/موارد را با خط خالی جدا کن)" },
        mode: {
          type: "radio",
          label: "قالب نمایش",
          options: [
            { label: "پاراگراف", value: "paragraphs" },
            { label: "فهرست نشانه‌دار", value: "bullets" },
          ],
        },
      },
      defaultProps: { body: "", mode: "paragraphs" },
      render: ({ body, mode }) => {
        const parts = (body ?? "").split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
        return (
          <div className="wrap mx-auto max-w-3xl space-y-4 py-6 text-sm leading-7 text-muted">
            {mode === "bullets" ? (
              <ul className="list-disc space-y-1 ps-5">
                {(body ?? "").split(/\n+/).map((part) => part.trim()).filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            ) : parts.map((paragraph, i) => <p key={i} className="whitespace-pre-line">{paragraph}</p>)}
          </div>
        );
      },
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
            badge: { type: "text", label: "برچسب کوچک (اختیاری)" },
            href: { type: "text", label: "پیوند داخلی/امن (اختیاری)" },
          },
          getItemSummary: (item) => item.title || "مورد جدید",
        },
      },
      defaultProps: { title: "", columns: "3", items: [] },
      render: ({ title, columns, items }) => (
        <section className="wrap py-6">
          {title ? <h2 className="title-lg mb-4 text-ink">{title}</h2> : null}
          <div className={columns === "2" ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
            {(items ?? []).map((item, i) => {
              const content = (
                <>
                  {item.badge ? <span className="chip mb-2 inline-flex">{item.badge}</span> : null}
                  <h3 className="font-bold">{item.title}</h3>
                  {item.body ? <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{item.body}</p> : null}
                </>
              );
              const className = "block rounded-2xl border border-slate-200 bg-white p-4";
              const href = safeDisplayHref(item.href);
              return href ? <a key={i} href={href} className={`${className} hover:border-indigo-200`}>{content}</a> : <article key={i} className={className}>{content}</article>;
            })}
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
        <section className="wrap my-8 rounded-3xl bg-slate-900 p-6 text-center text-white sm:p-10">
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
        <section className="wrap mx-auto max-w-md py-10">
          <HadiranMark className="mb-4 h-12 w-12" />
          <p className="hadiran-brand-text mb-2 text-sm font-medium">هادیران</p>
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
    EcosystemGrid: {
      label: "نقشهٔ اتاق‌ها (زنده)",
      fields: { heading: { type: "text", label: "عنوان بخش" } },
      defaultProps: { heading: "", items: [] },
      render: ({ heading, items }) => <LiveList heading={heading} layout="cards" limit="all" items={items} />,
    },
    PersonDetails: {
      label: "جزئیات معرفی (بلوک قدیمی/زنده)",
      fields: {},
      defaultProps: {},
      render: ({ profile, source }) => <PersonDetailsBlock profile={profile} source={source} />,
    },
    PersonPage: {
      label: "صفحهٔ معرفی هادی (نام و پروفایل زنده)",
      fields: {
        fallbackName: { type: "text", label: "نام وقتی رکورد شخص نیست" },
        fallbackKicker: { type: "text", label: "برچسب حالت بدون رکورد" },
        intro: { type: "textarea", label: "معرفی" },
        missingText: { type: "textarea", label: "متن وقتی رکورد شخص وجود ندارد" },
      },
      defaultProps: { fallbackName: "هادی", fallbackKicker: "", intro: "", missingText: "" },
      render: (props) => <PersonPageBlock {...props} />,
    },
    ContactMethods: {
      label: "راه‌های تماس واقعی (زنده)",
      fields: { emptyText: { type: "textarea", label: "متن وقتی راه تماس ثبت نشده" } },
      defaultProps: { emptyText: "" },
      render: ({ emptyText, methods, source }) => <ContactMethodsBlock emptyText={emptyText} methods={methods} source={source} />,
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

export type StudioRenderSlots = { accountPanel?: ReactNode; homePortrait?: ReactNode; knowledgeOwnerAction?: ReactNode };

/** بلوک‌های سیستمی فقط در صفحهٔ متناظرشان در کتابخانهٔ ادیتور نمایش داده می‌شوند. */
export function studioConfigForTarget(target: string, slots: StudioRenderSlots = {}): typeof studioConfig {
  const visible = new Set<string>([
    ...(target === "site:home" ? ["HadiranHomeHero", "HomeMarquee", "HomeFlow", "HomeRooms"] : []),
    ...(target === "site:signin" ? ["SignInPanel"] : []),
    ...(target === "site:account" ? ["AccountPanel"] : []),
    ...(target === "site:ecosystem" ? ["EcosystemGrid"] : []),
    ...(target === "site:person" ? ["PersonDetails", "PersonPage"] : []),
    ...(target === "site:contact" ? ["ContactMethods"] : []),
  ]);
  const hiddenSystem = new Set([
    "HadiranHomeHero",
    "HomeMarquee",
    "HomeFlow",
    "HomeRooms",
    "SignInPanel",
    "AccountPanel",
    "EcosystemGrid",
    "PersonDetails",
    "PersonPage",
    "ContactMethods",
  ]);
  if (["site:home", "site:signin", "site:account"].includes(target)) hiddenSystem.add("PageHero");
  const base = studioRenderConfig(slots);
  const components = Object.fromEntries(
    Object.entries(base.components).filter(([name]) => !hiddenSystem.has(name) || visible.has(name)),
  );
  const categories = Object.fromEntries(
    Object.entries(base.categories ?? {}).map(([name, category]) => [
      name,
      { ...category, components: (category.components ?? []).filter((component) => !hiddenSystem.has(component) || visible.has(component)) },
    ]),
  );
  return { ...base, components, categories } as typeof studioConfig;
}

/** Server-component slots carry real user/profile assets without putting them into Studio JSON. */
export function studioRenderConfig(slots: StudioRenderSlots = {}): typeof studioConfig {
  if (!slots.accountPanel && !slots.homePortrait && !slots.knowledgeOwnerAction) return studioConfig;
  const components = { ...studioConfig.components };
  if (slots.accountPanel) {
    components.AccountPanel = {
      ...studioConfig.components.AccountPanel,
      render: () => <div className="mx-auto max-w-3xl px-4 py-10">{slots.accountPanel}</div>,
    };
  }
  if (slots.homePortrait) {
    components.HadiranHomeHero = {
      ...studioConfig.components.HadiranHomeHero,
      render: (props) => <HadiranHomeHero {...props} portraitSlot={slots.homePortrait} />,
    };
  }
  if (slots.knowledgeOwnerAction) {
    components.KnowledgeList = {
      ...studioConfig.components.KnowledgeList,
      render: (props) => <LiveList {...props} ownerAction={slots.knowledgeOwnerAction} />,
    };
  }
  return { ...studioConfig, components };
}
