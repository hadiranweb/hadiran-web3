"use client";

import { useSyncExternalStore } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { readWorkspaceLocale, setWorkspaceLocale, subscribeWorkspaceLocale } from "./workspaceLocaleStore";

export function SettingsPanel() {
  const locale = useSyncExternalStore(subscribeWorkspaceLocale, readWorkspaceLocale, () => "fa" as const);

  function changeLocale(next: "fa" | "en") {
    setWorkspaceLocale(next);
  }

  return (
    <div className="ws-page">
      <header className="ws-page-heading">
        <div>
          <p className="ws-overline">میز</p>
          <h1>تنظیمات</h1>
          <p>زبان رابط میز و تم مرورگر. انتخاب در همین مرورگر می‌ماند.</p>
        </div>
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
            <p className="mt-1 text-sm text-muted">روشن، تاریک، یا مطابق سیستم. چراغ همان کنترل است.</p>
          </div>
          <ThemeToggle locale={locale} />
        </div>
      </section>
    </div>
  );
}
