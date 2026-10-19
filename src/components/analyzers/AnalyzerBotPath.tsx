"use client";

import Link from "next/link";
import { BotDisplayEditor } from "@/components/analyzers/BotDisplayEditor";
import type { AnalyzerPack, Item, PackBotDisplay } from "@/lib/analyzers/pack";
import { itemsOf } from "@/lib/analyzers/pack";
import { summaryPlaceholders } from "@/lib/analyzers/summary-template";
import { PATH_LANE_LABEL, stagesForService } from "@/lib/bots/path";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400";

export type AnalyzerBotLink = {
  id: string;
  titleFa: string;
  analyzerSlug: string | null;
  telegramUsername: string | null;
};

function kindFa(item: Item) {
  if (item.kind === "range") return "مقیاس ۰–۱۰";
  if (item.kind === "choice") return "گزینه";
  return "متن باز";
}

function inboundOf(item: Item, index: number) {
  if (item.kind === "range") return `q:${index}:0…10`;
  if (item.kind === "choice") return `c:${index}:0…${Math.max(0, item.options.length - 1)}`;
  return `متن تا ${item.maxLength} نویسه`;
}

export function AnalyzerBotPath({
  pack,
  bots,
  canEdit,
  onConsent,
  onSummary,
  onBotDisplay,
  onOpenItems,
}: {
  pack: AnalyzerPack;
  bots: AnalyzerBotLink[];
  canEdit: boolean;
  onConsent: (patch: { titleFa?: string; acceptLabelFa?: string; bodyFa?: string[] }) => void;
  onSummary: (templateFa: string) => void;
  onBotDisplay: (next: Partial<PackBotDisplay>) => void;
  onOpenItems: () => void;
}) {
  const examStages = stagesForService("analyzers", "exam");
  const items = itemsOf(pack);
  const placeholders = summaryPlaceholders(pack);
  const template = pack.report?.userSummaryTemplateFa ?? "";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="text-base font-bold text-slate-900">ربات‌هایی که این آزمون را می‌آورند</h2>
        {bots.length ? (
          <ul className="space-y-2 text-sm">
            {bots.map((bot) => (
              <li key={bot.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span>
                  {bot.titleFa}
                  {bot.telegramUsername ? ` · @${bot.telegramUsername}` : ""}
                  <span className="mr-2 text-xs text-slate-500">
                    {bot.analyzerSlug ? "فقط همین آزمون" : "همهٔ آزمون‌های باز"}
                  </span>
                </span>
                <Link href={`/workspace/bots/${bot.id}`} className="text-indigo-700">
                  مسیر اصلی ربات
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-7 text-slate-500">
            ربات را مالک در{" "}
            <Link href="/workspace/bots" className="text-indigo-700">
              میز ربات‌ها
            </Link>{" "}
            می‌سازد. مسیر هویت و فهرست آزمون آنجاست؛ اینجا فقط آنچه این آزمون نشان می‌دهد.
          </p>
        )}
        <p className="text-xs leading-6 text-slate-500">
          فراخوانی ورود به این آزمون: <span dir="ltr">exam:{pack.slug}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">{PATH_LANE_LABEL.exam}</h2>
        <p className="mt-1 text-xs leading-6 text-slate-500">بعد از زدن همین آزمون در ربات.</p>
        <ol className="mt-4 space-y-2">
          {examStages.map((stage, index) => (
            <li key={stage.id} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs text-white">
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-medium text-slate-900">{stage.titleFa}</span>
                <span className="block text-xs leading-5 text-slate-500">{stage.hintFa}</span>
                <ul className="mt-1 text-xs text-slate-500">
                  {stage.params.map((param) => (
                    <li key={param.id}>
                      {param.dir === "in" ? "ورود" : "خروج"}: {param.labelFa}
                    </li>
                  ))}
                </ul>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">رضایت آزمون</h2>
        <p className="text-xs leading-6 text-slate-500">
          ربات همین متن را می‌فرستد و دکمه با callback <span dir="ltr">packok</span> است. رنگ دکمه در مسیر ربات است.
        </p>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">عنوان</span>
          <input
            className={fieldClass}
            disabled={!canEdit}
            value={pack.consent.titleFa}
            onChange={(event) => onConsent({ titleFa: event.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">برچسب دکمه</span>
          <input
            className={fieldClass}
            disabled={!canEdit}
            value={pack.consent.acceptLabelFa}
            onChange={(event) => onConsent({ acceptLabelFa: event.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">متن (هر خط یک پاراگراف)</span>
          <textarea
            className={`${fieldClass} min-h-28`}
            disabled={!canEdit}
            value={pack.consent.bodyFa.join("\n")}
            onChange={(event) => onConsent({ bodyFa: event.target.value.split("\n").map((line) => line.trimEnd()) })}
          />
        </label>
      </section>

      <BotDisplayEditor pack={pack} canEdit={canEdit} onChange={onBotDisplay} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">سؤال‌هایی که ربات می‌فرستد</h2>
            <p className="mt-1 text-xs leading-6 text-slate-500">
              متن وب از تب سؤال‌ها. چیدمان تلگرام از «نحوه نمایش در ربات». راهنما پیام بعدی است.
            </p>
          </div>
          <button type="button" onClick={onOpenItems} className="text-sm text-indigo-700">
            ویرایش سؤال‌ها
          </button>
        </div>
        <ol className="space-y-2">
          {items.map((item, index) => {
            const section = pack.sections.find((row) => row.items.some((rowItem) => rowItem.id === item.id));
            return (
              <li key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                <p className="font-medium text-slate-900">
                  {index + 1}. {item.text}
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  {section?.titleFa ?? "بدون بخش"} · {kindFa(item)} · ورود {inboundOf(item, index)}
                  {item.kind === "range" ? " · ۰ راست، ۱۰ چپ" : ""}
                </p>
              </li>
            );
          })}
        </ol>
        {!items.length ? <p className="text-sm text-slate-500">هنوز سؤالی نیست.</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">خلاصهٔ ارسالی به کاربر</h2>
        <p className="text-xs leading-6 text-slate-500">
          وب و ربات یک قالب. تفسیر لایه/گلوگاه در تب تفسیر اولیه می‌ماند.
        </p>
        <textarea
          className={`${fieldClass} min-h-28`}
          disabled={!canEdit}
          value={template}
          onChange={(event) => onSummary(event.target.value)}
          placeholder="ارزیابی «{name}» ثبت شد."
        />
        <ul className="grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
          {placeholders.slice(0, 12).map((row) => (
            <li key={row.token}>
              <span dir="ltr">{row.token}</span>
              <span> — {row.hintFa}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
