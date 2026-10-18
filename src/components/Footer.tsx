import Link from "@/components/workspace/WorkspaceLink";
import { HadiranMark } from "@/components/HadiranMark";

const sections = [
  { href: "/ecosystem", label: "اکوسیستم" },
  { href: "/knowledge", label: "دانشنامه" },
  { href: "/topics", label: "موضوعات" },
  { href: "/lab", label: "آزمایشگاه" },
  { href: "/analyzers", label: "تحلیلگرها" },
  { href: "/courses", label: "دوره‌ها" },
  { href: "/shop", label: "فروشگاه" },
];

const identity = [
  { href: "/hadiran", label: "درباره من" },
  { href: "/contact", label: "راه‌های ارتباطی" },
  { href: "/privacy", label: "حریم خصوصی" },
  { href: "/account", label: "حساب من" },
  { href: "/signin", label: "ورود" },
  { href: "/workspace", label: "میز کار" },
];

export function Footer() {
  const year = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());

  return (
    <footer className="site-footer relative mt-20 overflow-hidden">
      <div className="wrap relative z-10 pt-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <HadiranMark size={30} className="brand-mark" />
              <span className="brand-name text-lg font-black">هادیران</span>
            </Link>
            <p className="soft max-w-sm text-sm leading-8">
              فضای هم‌فکری، شفاف‌سازی مسئله و طراحی سیستم‌ها؛ جایی برای پیوند گفتگو، دانش و اقدام.
            </p>
          </div>

          <nav aria-label="بخش‌های اکوسیستم">
            <h2 className="mb-3 text-xs font-black">بخش‌ها</h2>
            <ul className="space-y-2 text-sm">
              {sections.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="footer-link soft">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="هادی و ارتباط">
            <h2 className="mb-3 text-xs font-black">هادی و ارتباط</h2>
            <ul className="space-y-2 text-sm">
              {identity.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="footer-link soft">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="footer-copy mt-12 border-t pt-5 text-xs">© {year} هادیران</p>
      </div>
      <div className="footer-wordmark pointer-events-none select-none" aria-hidden="true">
        هادیران
      </div>
    </footer>
  );
}
