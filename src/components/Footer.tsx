import Link from "next/link";
import { HadiranMark } from "@/components/HadiranMark";
import { rooms } from "@/lib/copy";

const sections = [
  rooms.house,
  rooms.knowledge,
  rooms.topics,
  rooms.lab,
  rooms.mirrors,
  rooms.courses,
  rooms.shop,
];

const identity = [
  rooms.person,
  rooms.contact,
  rooms.privacy,
  { href: "/account", label: "حساب من" },
  { href: "/signin", label: "ورود" },
  { href: "/workspace", label: "میز کار" },
];

export function Footer() {
  const year = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());

  return (
    <footer className="print-hide site-footer relative mt-20 overflow-hidden print:hidden">
      <div className="wrap relative z-10 pt-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="brand-link inline-flex items-center gap-2.5">
              <HadiranMark className="brand-mark h-[30px] w-[30px]" />
              <span className="brand-name text-lg font-black">هادیران</span>
            </Link>
            <p className="soft max-w-sm text-sm leading-8">
              فضای هم‌فکری، شفاف‌سازی مسئله و طراحی سیستم‌ها؛ جایی برای پیوند گفتگو، دانش و اقدام.
            </p>
          </div>

          <nav aria-label="بخش‌های خانه">
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
