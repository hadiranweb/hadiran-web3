"use client";
import { createContext, useContext } from "react";
export type Locale = "fa" | "en";
export const WorkspaceContext = createContext({ locale: "fa" as Locale, setLocale: (_locale: Locale) => {}, demo: false, previewTicket: "" });
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  return { ...context, t: (fa: string, en: string) => context.locale === "fa" ? fa : en, number: (value: number) => value.toLocaleString(context.locale === "fa" ? "fa-IR" : "en-US") };
}
