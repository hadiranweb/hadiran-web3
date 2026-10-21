import Link from "next/link";
import { HadiranMark } from "@/components/HadiranMark";
import type { ChromeCopy } from "@/lib/content/registry";

function sectionsOf(copy: ChromeCopy) {
  return [
    copy.rooms.house,
    copy.rooms.knowledge,
    copy.rooms.topics,
    copy.rooms.lab,
    copy.rooms.mirrors,
    copy.rooms.courses,
    copy.rooms.shop,
  ];
}

function identityOf(copy: ChromeCopy) {
  return [
    copy.rooms.person,
    copy.rooms.contact,
    copy.rooms.privacy,
    { href: "/account", label: "حساب من" },
    { href: "/signin", label: "ورود" },
    { href: "/workspace", label: "میز کار" },
  ];
}

export function Footer({ copy }: { copy: ChromeCopy }) {
  const sections = sectionsOf(copy);
  const identity = identityOf(copy);
  const year = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());

  return (
    <footer className="print-hide site-footer relative mt-20 overflow-hidden print:hidden">
      <div className="wrap relative z-10 pt-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="brand-link inline-flex items-center gap-2.5">
              <HadiranMark className="brand-mark h-[30px] w-[30px]" />
              <span className="brand-name text-lg font-black">{copy.site.nameFa}</span>
            </Link>
            <p className="soft max-w-sm text-sm leading-8">{copy.site.tagline}</p>
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

        <p className="footer-copy mt-12 border-t pt-5 text-xs">© {year} {copy.site.nameFa}</p>
      </div>
      <div className="footer-wordmark pointer-events-none select-none" aria-hidden="true">
        {copy.site.nameFa}
      </div>
    </footer>
  );
}
