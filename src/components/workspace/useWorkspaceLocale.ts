"use client";

import { useSyncExternalStore } from "react";
import { readWorkspaceLocale, subscribeWorkspaceLocale } from "./workspaceLocaleStore";

export function useWorkspaceLocale() {
  const locale = useSyncExternalStore(subscribeWorkspaceLocale, readWorkspaceLocale, () => "fa" as const);

  const t = (fa: string, en: string) => (locale === "en" ? en : fa);
  const number = (value: number) => value.toLocaleString(locale === "fa" ? "fa-IR" : "en-GB");
  return { locale, t, number };
}
