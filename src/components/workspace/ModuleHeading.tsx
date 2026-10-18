"use client";
import type { ReactNode } from "react";
import { useWorkspace } from "./WorkspaceContext";
export function ModuleHeading({ title, en, lede, ledeEn, action }: { title: string; en: string; lede?: string; ledeEn?: string; action?: ReactNode }) {
  const { t } = useWorkspace();
  return <div className="ws-page-heading"><div><p className="ws-overline">{t("فضای مدیریت هادیران", "HADIRAN WORKSPACE")}</p><h1>{t(title,en)}</h1>{lede ? <p>{t(lede,ledeEn || lede)}</p> : null}</div>{action}</div>;
}
