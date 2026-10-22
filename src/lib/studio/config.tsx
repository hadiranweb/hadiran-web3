/**
 * رجیستری بلوک‌های مجاز استودیو هادیران (Puck Config).
 * حاکمیت طراحی: هیچ فیلد رنگ/فونت آزادی نیست؛ فقط واریانت‌های سیستم طراحی.
 * همین Config هم در ادیتور و هم در رندر عمومی /p/[slug] استفاده می‌شود.
 */
import type { Config } from "@puckeditor/core";

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

type SectionHeaderProps = { kicker: string; title: string; lead: string; align: "start" | "center" };
type RichTextProps = { body: string };
type BentoProps = { title: string; columns: "2" | "3"; items: { title: string; body: string }[] };
type CtaProps = { title: string; lead: string; label: string; href: string };
type DividerProps = { space: "sm" | "md" | "lg" };

export const studioConfig: Config<{
  PageHero: HeroProps;
  SectionHeader: SectionHeaderProps;
  RichText: RichTextProps;
  BentoGrid: BentoProps;
  CTABand: CtaProps;
  Divider: DividerProps;
}> = {
  root: {
    render: ({ children }) => (
      <main className="mx-auto w-full max-w-5xl px-4 py-10 text-slate-900">{children}</main>
    ),
  },
  categories: {
    structure: { title: "ساختار", components: ["PageHero", "SectionHeader", "Divider"] },
    content: { title: "محتوا", components: ["RichText", "BentoGrid"] },
    conversion: { title: "تصمیم و تبدیل", components: ["CTABand"] },
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
        title: "عنوان صفحه",
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
          <h1 className="mt-2 text-3xl font-black leading-snug sm:text-4xl">{title}</h1>
          {lead ? <p className="mt-4 leading-8 text-slate-600">{lead}</p> : null}
          {(primaryLabel || secondaryLabel) && (
            <div className={align === "center" ? "mt-6 flex flex-wrap justify-center gap-3" : "mt-6 flex flex-wrap gap-3"}>
              {primaryLabel ? (
                <a href={primaryHref || "#"} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">
                  {primaryLabel}
                </a>
              ) : null}
              {secondaryLabel ? (
                <a href={secondaryHref || "#"} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700">
                  {secondaryLabel}
                </a>
              ) : null}
            </div>
          )}
        </section>
      ),
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
      defaultProps: { kicker: "", title: "عنوان بخش", lead: "", align: "start" },
      render: ({ kicker, title, lead, align }) => (
        <header className={align === "center" ? "py-6 text-center" : "py-6"}>
          {kicker ? <p className="text-xs font-bold text-indigo-700">{kicker}</p> : null}
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
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
          getItemSummary: (item) => item.title || "کارت",
        },
      },
      defaultProps: { title: "", columns: "3", items: [{ title: "کارت", body: "" }] },
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
    CTABand: {
      label: "نوار دعوت به اقدام (CTA)",
      fields: {
        title: { type: "text", label: "عنوان" },
        lead: { type: "textarea", label: "توضیح" },
        label: { type: "text", label: "متن دکمه" },
        href: { type: "text", label: "پیوند دکمه" },
      },
      defaultProps: { title: "", lead: "", label: "شروع", href: "/" },
      render: ({ title, lead, label, href }) => (
        <section className="my-8 rounded-3xl bg-slate-900 p-6 text-center text-white sm:p-10">
          {title ? <h2 className="text-2xl font-black">{title}</h2> : null}
          {lead ? <p className="mx-auto mt-3 max-w-2xl leading-8 text-slate-300">{lead}</p> : null}
          <a href={href || "#"} className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-black text-slate-900">
            {label || "شروع"}
          </a>
        </section>
      ),
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
