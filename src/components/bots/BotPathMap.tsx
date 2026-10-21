"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BOT_BUTTON_STYLE_OPTIONS,
  BOT_CHROME_FIELDS,
  BOT_FLOW_FIELDS,
  BOT_KEY_ACTION_OPTIONS,
  BOT_TEXT_FIELDS,
  type BotButtonStyle,
  type BotChrome,
  type BotFlow,
  type BotKey,
  type BotScript,
  type BotService,
  type BotTexts,
} from "@/lib/bots/script";
import { PATH_LANE_LABEL, stageIsOn, stagesForService, type PathLane, type PathStage } from "@/lib/bots/path";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400";

export function BotPathMap({
  script,
  service,
  analyzerSlug,
  analyzers,
  onFlow,
  onText,
  onChrome,
  onPatchKey,
  onMoveKey,
}: {
  script: BotScript;
  service: BotService;
  analyzerSlug: string;
  analyzers: { slug: string; nameFa: string }[];
  onFlow: (id: keyof BotFlow, value: boolean) => void;
  onText: (id: keyof BotTexts, value: string) => void;
  onChrome: (id: keyof BotChrome, value: BotButtonStyle) => void;
  onPatchKey: (id: string, patch: Partial<BotKey>) => void;
  onMoveKey: (id: string, dir: -1 | 1) => void;
}) {
  const stages = useMemo(() => stagesForService(service), [service]);
  const [openId, setOpenId] = useState<string>(service === "analyzers" ? "start" : "start");
  const open = stages.find((stage) => stage.id === openId) ?? stages[0];

  return (
    <div className="space-y-6">
      <p className="text-sm leading-7 text-slate-600">
        مسیر سرویس ثابت است؛ مرحلهٔ آزاد ساخته نمی‌شود. اختیاری‌ها را خاموش کنید، متن و رنگ را همین‌جا بگذارید.
        ادامهٔ هر آزمون در میز همان آزمون است.
      </p>

      <ChromeCard
        script={script}
        service={service}
        onChrome={onChrome}
        onPatchKey={onPatchKey}
        onMoveKey={onMoveKey}
      />

      {(["main", "exam"] as PathLane[])
        .filter((lane) => stages.some((stage) => stage.lane === lane))
        .map((lane) => (
          <section key={lane} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-bold text-slate-900">{PATH_LANE_LABEL[lane]}</h2>
            {lane === "exam" ? (
              <p className="mt-1 text-xs leading-6 text-slate-500">
                این مرحله‌ها بعد از انتخاب آزمون اجرا می‌شوند. رضایت، سؤال و خلاصه از pack آزمون است.
                {analyzerSlug
                  ? ` این ربات فقط «${analyzers.find((item) => item.slug === analyzerSlug)?.nameFa ?? analyzerSlug}» را نشان می‌دهد.`
                  : " فهرست همهٔ آزمون‌های باز."}
              </p>
            ) : (
              <p className="mt-1 text-xs leading-6 text-slate-500">از /start تا رسیدن به فهرست آزمون.</p>
            )}
            <ol className="mt-4 space-y-2">
              {stages
                .filter((stage) => stage.lane === lane)
                .map((stage, index) => {
                  const on = stageIsOn(stage, script.flow);
                  const selected = open?.id === stage.id;
                  return (
                    <li key={stage.id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(stage.id)}
                        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-right ${
                          selected
                            ? "border-indigo-300 bg-indigo-50"
                            : on
                              ? "border-slate-200 bg-slate-50"
                              : "border-dashed border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        <span
                          className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                            on ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-900">
                            {stage.titleFa}
                            {!on ? <span className="mr-2 text-xs font-normal text-slate-400">خاموش</span> : null}
                            {stage.edit === "pack" ? (
                              <span className="mr-2 text-xs font-normal text-indigo-700">از آزمون</span>
                            ) : null}
                            {stage.edit === "both" ? (
                              <span className="mr-2 text-xs font-normal text-indigo-700">ربات + آزمون</span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">{stage.hintFa}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ol>
          </section>
        ))}

      {open ? (
        <StagePanel
          stage={open}
          script={script}
          service={service}
          analyzerSlug={analyzerSlug}
          analyzers={analyzers}
          onFlow={onFlow}
          onText={onText}
        />
      ) : null}
    </div>
  );
}

function ChromeCard({
  script,
  service,
  onChrome,
  onPatchKey,
  onMoveKey,
}: {
  script: BotScript;
  service: BotService;
  onChrome: (id: keyof BotChrome, value: BotButtonStyle) => void;
  onPatchKey: (id: string, patch: Partial<BotKey>) => void;
  onMoveKey: (id: string, dir: -1 | 1) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900">{PATH_LANE_LABEL.nav}</h2>
        <p className="mt-1 text-xs leading-6 text-slate-500">
          تلگرام رنگ سفارشی (hex) ندارد؛ فقط آبی، سبز، قرمز یا بدون رنگ. محل: پایین چت یا منوی /.
        </p>
      </div>
      <ul className="space-y-2">
        {script.keys.map((key, index) => (
          <li key={key.id} className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-6">
            <p className="sm:col-span-2 text-sm font-medium text-slate-800">
              {key.labelFa || "بدون عنوان"}
              <span className="mr-2 text-xs font-normal text-slate-500">
                {BOT_KEY_ACTION_OPTIONS.find((item) => item.id === key.action)?.labelFa}
              </span>
            </p>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={key.inKeyboard}
                onChange={(event) => onPatchKey(key.id, { inKeyboard: event.target.checked })}
              />
              پایین چت
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={key.inMenu}
                onChange={(event) => onPatchKey(key.id, { inMenu: event.target.checked })}
              />
              منوی /
            </label>
            <select
              className={fieldClass}
              value={key.style ?? "auto"}
              onChange={(event) =>
                onPatchKey(key.id, { style: event.target.value as BotKey["style"] })
              }
            >
              {BOT_BUTTON_STYLE_OPTIONS.map((item) => (
                <option key={item.id || "none"} value={item.id}>
                  {item.labelFa}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-slate-500"
                disabled={index === 0}
                onClick={() => onMoveKey(key.id, -1)}
              >
                بالا
              </button>
              <button
                type="button"
                className="text-xs text-slate-500"
                disabled={index === script.keys.length - 1}
                onClick={() => onMoveKey(key.id, 1)}
              >
                پایین
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="grid gap-3 sm:grid-cols-2">
        {BOT_CHROME_FIELDS.filter((field) => !field.services || field.services.includes(service)).map((field) => (
          <label key={field.id} className="block text-sm">
            <span className="mb-1 block text-slate-600">{field.labelFa}</span>
            <select
              className={fieldClass}
              value={script.chrome[field.id]}
              onChange={(event) => onChrome(field.id, event.target.value as BotButtonStyle)}
            >
              {BOT_BUTTON_STYLE_OPTIONS.filter((item) => item.id !== "auto").map((item) => (
                <option key={item.id || "none"} value={item.id}>
                  {item.labelFa}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}

function StagePanel({
  stage,
  script,
  service,
  analyzerSlug,
  analyzers,
  onFlow,
  onText,
}: {
  stage: PathStage;
  script: BotScript;
  service: BotService;
  analyzerSlug: string;
  analyzers: { slug: string; nameFa: string }[];
  onFlow: (id: keyof BotFlow, value: boolean) => void;
  onText: (id: keyof BotTexts, value: string) => void;
}) {
  const flowField = BOT_FLOW_FIELDS.find((field) => field.id === stage.gate);
  const bound = analyzers.find((item) => item.slug === analyzerSlug);

  return (
    <section className="rounded-2xl border border-indigo-200 bg-white p-5 space-y-4">
      <div>
        <p className="text-xs text-indigo-700">{PATH_LANE_LABEL[stage.lane]}</p>
        <h3 className="text-base font-bold text-slate-900">{stage.titleFa}</h3>
        <p className="mt-1 text-sm leading-7 text-slate-600">{stage.hintFa}</p>
      </div>
      {flowField ? (
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={script.flow[flowField.id]}
            onChange={(event) => onFlow(flowField.id, event.target.checked)}
          />
          <span>{flowField.labelFa}</span>
        </label>
      ) : (
        <p className="text-xs text-slate-500">این مرحله همیشه در مسیر سرویس هست.</p>
      )}
      {stage.id === "pick" ? (
        <p className="text-sm leading-6 text-slate-600">
          {bound ? (
            <>
              محدود به{" "}
              <Link className="text-indigo-700" href={`/workspace/analyzers/${bound.slug}`}>
                {bound.nameFa}
              </Link>
            </>
          ) : (
            <>
              همهٔ آزمون‌های باز. مسیر هر آزمون را در{" "}
              <Link className="text-indigo-700" href="/workspace/analyzers">
                میز آزمون‌ساز
              </Link>{" "}
              ببینید.
            </>
          )}
        </p>
      ) : null}
      {stage.edit !== "bot" ? (
        <p className="text-sm leading-6 text-slate-600">
          محتوای نمایش‌داده‌شده از pack آزمون است. در تب «ربات» همان آزمون ویرایش می‌شود.
        </p>
      ) : null}
      <div>
        <h4 className="text-sm font-medium text-slate-800">پارامتر ورود و خروج</h4>
        <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {stage.params.map((param) => (
            <li key={param.id} className="grid gap-1 px-3 py-2 text-xs sm:grid-cols-3">
              <span className={param.dir === "in" ? "text-teal-800" : "text-indigo-800"}>
                {param.dir === "in" ? "ورودی" : "خروجی"}
              </span>
              <span className="font-medium text-slate-800">{param.labelFa}</span>
              <span className="text-slate-500">{param.whereFa}</span>
            </li>
          ))}
        </ul>
      </div>
      {stage.texts.map((id) => {
        const field = BOT_TEXT_FIELDS.find((item) => item.id === id);
        if (!field) return null;
        const long = id === "policy" || id === "welcome" || id === "help";
        return (
          <label key={id} className="block text-sm">
            <span className="mb-1 block text-slate-600">
              {field.labelFa}
              {field.hintFa ? <span className="mr-2 text-xs text-slate-400">{field.hintFa}</span> : null}
            </span>
            {long ? (
              <textarea
                className={`${fieldClass} min-h-28`}
                value={script.texts[id]}
                onChange={(event) => onText(id, event.target.value)}
              />
            ) : (
              <input
                className={fieldClass}
                value={script.texts[id]}
                onChange={(event) => onText(id, event.target.value)}
              />
            )}
          </label>
        );
      })}
    </section>
  );
}
