"use client";

import { Render } from "@puckeditor/core";
import { studioConfig } from "@/lib/studio/config";
import type { StudioData } from "@/lib/studio/validate";

/** رندر عمومی صفحهٔ استودیو با همان Config ادیتور؛ فقط دادهٔ منتشرشده به این‌جا می‌رسد. */
export function StudioRender({ data }: { data: StudioData }) {
  return <Render config={studioConfig} data={data as never} />;
}
