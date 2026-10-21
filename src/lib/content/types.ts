/** تیپ‌های مشترک میز متن — بدون server-only تا ویرایشگر کلاینت هم بتواند import کند. */

import type { CopyGroup } from "./registry";

export type CopyDeskSource = "live" | "error";

export type CopyEntry = {
  key: string;
  group: CopyGroup;
  label: string;
  hint?: string;
  maxLength: number;
  multiline: boolean;
  usedAt: string[];
  fallback: string;
  live: string | null;
  draft: string | null;
  revision: number;
  updatedAt: string | null;
  publishedAt: string | null;
  note: string | null;
};

export type GroupSummary = {
  group: CopyGroup;
  total: number;
  overrides: number;
  drafts: number;
};

export type HistoryRow = {
  revision: number;
  snapshot: unknown;
  note: string | null;
  at: string | null;
  actorId: number | null;
};
