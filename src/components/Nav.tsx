"use client";
import { useEffect } from "react";
import Link from "@/components/workspace/WorkspaceLink";
import { usePathname } from "next/navigation";
import { ChartNoAxesCombined, BookOpen, FlaskConical, GraduationCap, Layers, Menu, ShoppingBag, User, X, ArrowUpLeft } from "lucide-react";
import { HadiranMark } from "@/components/HadiranMark";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { SessionMenu } from "@/components/auth/SessionMenu";
import { useDisclosure } from "@/components/navigation/useDisclosure";
const primaryLinks = [
  { href: "/ecosystem", label: "اکوسیستم", note: "نگاه یکپارچه به هادیران", icon: Layers },
  { href: "/hadiran", label: "درباره من", note: "مسیر و نگاه هادی", icon: User },
  { href: "/knowledge", label: "دانشنامه", note: "از ایده تا دانش", icon: BookOpen },
  { href: "/lab", label: "آزمایشگاه", note: "پروژه‌ها و تجربه‌ها", icon: FlaskConical },
  { href: "/courses", label: "دوره‌ها", note: "مسیر یادگیری", icon: GraduationCap },
  { href: "/analyzers", label: "تحلیلگرها", note: "ارزیابی و گزارش شخصی", icon: ChartNoAxesCombined },
  { href: "/shop", label: "فروشگاه", note: "محصولات و دسترسی‌ها", icon: ShoppingBag },
];
export function Nav() {
  const pathname = usePathname();
  const { open, visible, panel, trigger, toggle, close } = useDisclosure();
  useEffect(() => { close(); }, [pathname, close]);
  useEffect(() => {
    const screen = window.matchMedia("(min-width: 90rem)");
    const change = () => { if (screen.matches) close(); };
    screen.addEventListener("change", change); return () => screen.removeEventListener("change", change);
  }, [close]);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return <header className="site-header sticky top-3 z-50 px-3 sm:px-5">
    <div className="nav-anchor mx-auto max-w-7xl">
      <div className="nav-pill site-nav-bar">
        <Link href="/" className="brand-link" onClick={() => close()}><HadiranMark size={28} className="brand-mark" /><span className="brand-name">هادیران</span></Link>
        <nav aria-label="ناوبری اصلی" className="site-desktop-navigation">{primaryLinks.map((link) => <Link key={link.href} href={link.href} className="nav-link" aria-current={isActive(link.href) ? "page" : undefined}><link.icon size={14} aria-hidden="true" />{link.label}</Link>)}</nav>
        <div className="site-nav-actions">
          <ThemeSwitcher />
          <SessionMenu />
          <button ref={trigger} type="button" onClick={toggle} className="nav-menu-toggle" aria-label={open ? "بستن منو" : "باز کردن منو"} aria-expanded={open} aria-controls="mobile-navigation">{open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}</button>
        </div>
      </div>
      <div id="mobile-navigation" ref={panel} className="site-nav-dropdown" hidden={!visible} inert={!open || undefined} aria-hidden={!open}>
        <div className="site-nav-dropdown-heading"><span>مسیرت را انتخاب کن</span><small>فضای هادیران</small></div>
        <nav aria-label="ناوبری بازشونده"><ul className="site-nav-grid">{primaryLinks.map((link) => <li key={link.href}><Link href={link.href} onClick={() => close()} aria-current={isActive(link.href) ? "page" : undefined}><span className="site-nav-icon"><link.icon size={20} aria-hidden="true" /></span><span><strong>{link.label}</strong><small>{link.note}</small></span><ArrowUpLeft size={16} className="site-nav-arrow" aria-hidden="true" /></Link></li>)}</ul></nav>
        <div className="site-nav-dropdown-foot"><Link href="/contact" onClick={() => close()}>ارتباط با هادیران<ArrowUpLeft size={15} /></Link><Link href="/privacy" onClick={() => close()}>حریم خصوصی</Link></div>
      </div>
    </div>
  </header>;
}
