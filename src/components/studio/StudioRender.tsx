import type { ReactNode } from "react";
import { Render } from "@puckeditor/core/rsc";
import { studioRenderConfig } from "@/lib/studio/config";
import type { StudioData } from "@/lib/studio/validate";

/**
 * رندر عمومیِ snapshot منتشرشده با همان Config ادیتور.
 * خروجی Puck در سرور رندر می‌شود؛ داده‌های فهرست روی صفحه به client island تبدیل نمی‌شوند.
 * بلوک AccountPanel یک slot به محتوای سروریِ حساب است؛ آن داده هرگز داخل JSON صفحه ذخیره نمی‌شود.
 */
export function StudioRender({
  data,
  accountPanel,
  homePortrait,
  knowledgeOwnerAction,
}: {
  data: StudioData;
  accountPanel?: ReactNode;
  homePortrait?: ReactNode;
  knowledgeOwnerAction?: ReactNode;
}) {
  return <Render config={studioRenderConfig({ accountPanel, homePortrait, knowledgeOwnerAction })} data={data as never} />;
}
