import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Vazirmatn } from "next/font/google";
import { siteConfig } from "@/lib/site";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "هادیران | فضای هم‌فکری، شفاف‌سازی مسئله و طراحی سیستم‌ها",
    template: "%s | هادیران",
  },
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/hadiran-icon-v3.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/hadiran-icon-v3.png", sizes: "512x512" }],
  },
  openGraph: {
    siteName: siteConfig.nameFa,
    locale: "fa_IR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
