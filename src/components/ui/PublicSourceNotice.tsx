import type { PublicSource } from "@/lib/public/source";
import { EmptyState } from "@/components/ui/EmptyState";

export const PUBLIC_SOURCE_COPY = {
  unavailable: "اتصال به منبع برقرار نیست؛ این به‌معنای خالی بودن نیست.",
  error: "خواندن داده الان ممکن نیست؛ این به‌معنای خالی بودن نیست.",
} as const;

export function PublicSourceNotice({ source }: { source: PublicSource }) {
  if (source === "live") return null;
  return <EmptyState title={PUBLIC_SOURCE_COPY[source]} />;
}
