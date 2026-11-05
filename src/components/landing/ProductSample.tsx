"use client";
import { useState } from "react";
import { BookOpen, Download } from "lucide-react";
import { downloadText } from "@/lib/landing/browser-state";
import { ToolDialog } from "./ToolDialog";
const sample = `هادیران / نمونهٔ رایگان راهنمای دیدن رابطه‌ها\n\nاین یک کاربرگ کوتاه و مستقل برای پیش‌نمایش محصول نمایشی است؛ فایل محصول خریداری‌شده نیست.\n\n۱. مشاهده، نه تفسیر\nیک رخداد را بدون قضاوت بنویس. به جای «همیشه دیر می‌کند»، بنویس «جلسهٔ دوشنبه ده دقیقه دیر شروع شد».\n\n۲. رابطه‌های ممکن\nچه چیزهایی پیش از این رخداد اتفاق افتاد؟ چه کسی اطلاعات را دیر دریافت کرد؟ دو توضیح جایگزین یادداشت کن. هنوز هیچ‌کدام را واقعیت فرض نکن.\n\n۳. یک آزمایش کوچک\nتغییر کوچکی انتخاب کن که بتوانی هفتهٔ آینده امتحان کنی؛ مثلاً زمان جلسه را یک روز زودتر یادآوری کن. قبل از اجرا بنویس چه چیزی را مشاهده خواهی کرد.\n\nمشاهدهٔ من:\n\nدو توضیح ممکن:\n\nقدم بعدی و زمان بازبینی:\n\n`;
export function ProductSample() {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="lp-sample-button" onClick={() => setOpen(true)}><BookOpen size={19} /><span>قبل از انتخاب، ورق بزن<small>نمونهٔ رایگان · یک کاربرگ واقعی برای دریافت</small></span><span aria-hidden="true">←</span></button><ToolDialog open={open} onClose={() => setOpen(false)} title="چند خط برای شروع"><div className="lp-sample-pages"><span className="lp-eyebrow">پیش‌نمایش / راهنمای دیدن رابطه‌ها</span><h3>پیش از نتیجه‌گیری،<br />یک بار دیگر نگاه کن.</h3><p>یک نمونهٔ کوتاه و رایگان برای آشنایی با شیوهٔ تمرین؛ نه فایل کامل یا محتوای خریداری‌شده.</p>{sample.split("\n\n").slice(2, 5).map((text, i) => <section key={text}><span>{(i + 1).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}</span><p>{text}</p></section>)}</div><button type="button" className="lp-button" onClick={() => downloadText("hadiran-free-worksheet.txt", sample)}><Download size={18} /> دریافت کاربرگ رایگان (متنی)</button></ToolDialog></>;
}
