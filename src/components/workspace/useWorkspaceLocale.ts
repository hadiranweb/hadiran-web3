"use client";

import { useEffect, useState } from "react";

export function useWorkspaceLocale() {
  const [locale, setLocale] = useState<"fa" | "en">("fa");

  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )hadiran-workspace-locale=([^;]*)/);
      if (match?.[1] === "en") setLocale("en");
    } catch {
      /* ignore */
    }
  }, []);

  const t = (fa: string, en: string) => (locale === "en" ? en : fa);
  const number = (value: number) => value.toLocaleString(locale === "fa" ? "fa-IR" : "en-GB");
  return { locale, t, number };
}
