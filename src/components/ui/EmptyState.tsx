import type { ReactNode } from "react";
import { HadiranMark } from "@/components/HadiranMark";

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="surface px-6 py-14 text-center">
      <HadiranMark className="mx-auto mb-4 h-10 w-10" />
      <p className="text-sm leading-7 text-muted">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
