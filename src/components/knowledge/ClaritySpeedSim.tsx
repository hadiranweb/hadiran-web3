"use client";

import { useMemo, useState } from "react";
import type { ArticleSimulator } from "@/lib/knowledge/article";

export function ClaritySpeedSim({ simulator }: { simulator: ArticleSimulator }) {
  const [clarity, setClarity] = useState(100);
  const [speed, setSpeed] = useState(100);

  const result = useMemo(() => {
    const c = clarity / 100;
    const s = speed / 100;
    const chaos = Math.round((1 - c) * s * 100);
    const efficiency = Math.round(c * (0.35 + 0.65 * s) * 100);
    const healthy = c >= 0.7;
    return { chaos, efficiency, healthy };
  }, [clarity, speed]);

  return (
    <section className="article-sim" aria-label="شبیه‌ساز تعاملی">
      <p className="chip">شبیه‌سازِ زنده</p>
      <h2 className="title-lg mt-3 text-ink">
        {simulator.titleFa?.trim() || "شبیه‌ساز تعاملی: سرعتِ ابزار در برابر شفافیتِ معماری"}
      </h2>
      <p className="muted mt-2 text-sm leading-7">
        {simulator.introFa?.trim() ||
          "نوار «شفافیتِ فرایند» و «سرعتِ اتوماسیون» را تکان بده تا ببینی خروجی واقعی تیم چه تغییری می‌کند:"}
      </p>

      <label className="article-sim-slider">
        <span>
          شفافیتِ فرایند و زبان مشترک
          <strong>{clarity.toLocaleString("fa-IR")}٪</strong>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={clarity}
          onChange={(event) => setClarity(Number(event.target.value))}
        />
        <small>آیا روی کاغذ معلوم است هر تصمیم مال کیست؟</small>
      </label>

      <label className="article-sim-slider">
        <span>
          سرعتِ اتوماسیون و هوش مصنوعی
          <strong>{speed.toLocaleString("fa-IR")}٪</strong>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
        />
        <small>چقدر ابزارهای خودکار و سریع روی کار بسته‌ایم؟</small>
      </label>

      <div className="article-sim-result">
        <p className="text-sm font-bold text-ink">نتیجهٔ معماری در این وضعیت:</p>
        <p className="mt-2 text-sm leading-7 text-ink">
          {result.healthy
            ? "🌱 وضعیتِ سالم: چون منطقِ کار روشن است، ابزار واقعاً بار را از دوشِ تیم برمی‌دارد."
            : "🔥 آشفتگی: ابزارِ سریع روی فرایند مبهم، ابهام را فقط سریع‌تر تکثیر می‌کند."}
        </p>
        <dl className="article-sim-meters">
          <div>
            <dt>آشفتگیِ تولیدشده</dt>
            <dd>{result.chaos.toLocaleString("fa-IR")}٪</dd>
          </div>
          <div>
            <dt>کاراییِ واقعی</dt>
            <dd>{result.efficiency.toLocaleString("fa-IR")}٪</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
