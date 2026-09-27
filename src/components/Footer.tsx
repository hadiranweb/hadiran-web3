import Link from "next/link";
import { HadiranMark } from "@/components/HadiranMark";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <HadiranMark className="h-6 w-6" />
            <span>© {new Date().getFullYear()} هادیران — فضای هم‌فکری و طراحی سیستم‌ها</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              هم‌فکری
            </Link>
            <Link href="/ecosystem" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              اکوسیستم
            </Link>
            <Link href="/hadiran" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              درباره من
            </Link>
            <Link href="/knowledge" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              دانشنامه
            </Link>
            <Link href="/lab" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              آزمایشگاه
            </Link>
            <Link href="/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              دوره‌ها
            </Link>
            <Link href="/shop" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              فروشگاه
            </Link>
            <Link href="/topics" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              موضوعات
            </Link>
            <Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              تماس
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
