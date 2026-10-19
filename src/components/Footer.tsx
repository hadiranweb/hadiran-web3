import Link from "next/link";
import { HadiranMark } from "@/components/HadiranMark";
import { rooms } from "@/lib/copy";

const links = [
  { href: "/", label: "هم‌فکری" },
  rooms.house,
  rooms.person,
  rooms.knowledge,
  rooms.lab,
  rooms.mirrors,
  rooms.courses,
  rooms.shop,
  rooms.topics,
  rooms.contact,
  rooms.privacy,
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-muted">
          <HadiranMark className="h-5 w-5" />
          <span>© {new Date().getFullYear()} هادیران</span>
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
