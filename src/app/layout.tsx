import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { OnboardingDialog } from "@/components/auth/OnboardingDialog";
import { SiteChrome } from "@/components/SiteChrome";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import localFont from "next/font/local";
import { siteConfig } from "@/lib/site";

const iranSharp = localFont({
  src: [
    { path: "./fonts/IRANSharp-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/IRANSharp-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IRANSharp-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-iransharp",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "هادیران | فضای هم‌فکری، شفاف‌سازی مسئله و طراحی سیستم‌ها",
    template: "%s | هادیران",
  },
  description: siteConfig.description,
  openGraph: {
    siteName: siteConfig.nameFa,
    locale: "fa_IR",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "512x512" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF9F5" },
    { media: "(prefers-color-scheme: dark)", color: "#080B11" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={iranSharp.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var p='system';try{var s=localStorage.getItem('hadiran-theme');if(s==='light'||s==='dark')p=s;}catch(e){}var r=document.documentElement;r.dataset.themePreference=p;r.dataset.theme=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;r.classList.toggle('dark',r.dataset.theme==='dark');})();` }} />
      </head>
      <body className="site-body flex min-h-screen flex-col antialiased">
        <SiteChrome navigation={<Nav />} footer={<Footer />}>{children}</SiteChrome>
        <OnboardingDialog />
      </body>
    </html>
  );
}
