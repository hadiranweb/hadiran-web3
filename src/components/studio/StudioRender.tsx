"use client";

import type { ReactNode } from "react";
import { Render } from "@puckeditor/core";
import { studioRenderConfig } from "@/lib/studio/config";
import type { StudioData } from "@/lib/studio/validate";

/**
 * رندر عمومیِ snapshot منتشرشده با همان Config ادیتور.
 * بلوک AccountPanel یک slot به محتوای سروریِ حساب است؛ آن داده هرگز داخل JSON صفحه ذخیره نمی‌شود.
 */
export function StudioRender({ data, accountPanel }: { data: StudioData; accountPanel?: ReactNode }) {
  return <Render config={studioRenderConfig(accountPanel)} data={data as never} />;
}
