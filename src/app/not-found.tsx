import Link from "next/link";
import { rooms } from "@/lib/copy";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="mb-2 text-sm font-medium text-mark">۴۰۴</p>
      <h1 className="text-2xl font-extrabold text-ink">این صفحه پیدا نشد</h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        آدرس عوض شده یا هرگز وجود نداشته. از خانه یا یکی از اتاق‌ها ادامه بده.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-medium text-accent-fg"
        >
          خانه
        </Link>
        <Link
          href={rooms.house.href}
          className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-4 text-sm font-medium text-ink hover:bg-elev"
        >
          {rooms.house.label}
        </Link>
      </div>
    </main>
  );
}
