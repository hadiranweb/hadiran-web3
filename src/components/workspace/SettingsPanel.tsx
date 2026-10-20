"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const COOKIE = "hadiran-workspace-locale";

export function SettingsPanel() {
  const [locale, setLocale] = useState<"fa" | "en">("fa");

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )hadiran-workspace-locale=([^;]*)/);
    setLocale(match?.[1] === "en" ? "en" : "fa");
  }, []);

  function changeLocale(next: "fa" | "en") {
    setLocale(next);
    document.cookie = `${COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold text-ink">تنظیمات</h1>
        <p className="mt-2 text-sm leading-7 text-muted">زبان رابط میز و تم مرورگر. انتخاب در همین مرورگر می‌ماند.</p>
      </header>

      <section className="space-y-4 rounded-[var(--radius-md)] border border-line bg-elev p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-ink">زبان رابط کاربری</h2>
            <p className="mt-1 text-sm text-muted">منو و جهت میز با زبان همراه می‌شود.</p>
          </div>
          <select
            value={locale}
            onChange={(event) => changeLocale(event.target.value === "en" ? "en" : "fa")}
            aria-label="زبان رابط کاربری"
            className="min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3 text-sm text-ink"
          >
            <option value="fa">فارسی</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div>
            <h2 className="font-medium text-ink">تم سایت</h2>
            <p className="mt-1 text-sm text-muted">چراغ مطالعه شب یا نور روز.</p>
          </div>
          <ThemeToggle />
        </div>
      </section>
    </main>
  );
}
