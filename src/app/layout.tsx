import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { OnboardingDialog } from "@/components/auth/OnboardingDialog";
import { ReferralCapture } from "@/components/auth/ReferralCapture";
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
    default: "هادیران | خانه‌ایست که هر دری در آن به یک سؤال بهتر باز می‌شود",
    template: "%s | هادیران",
  },
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "512x512" }],
  },
  openGraph: {
    siteName: siteConfig.nameFa,
    locale: "fa_IR",
    type: "website",
  },
};

const themeBoot = `(()=>{try{var t=localStorage.getItem("hadiran-theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="flex min-h-screen flex-col bg-paper text-ink antialiased">
        <SiteChrome>{children}</SiteChrome>
        <Suspense fallback={null}>
          <ReferralCapture />
        </Suspense>
        <OnboardingDialog />
      </body>
    </html>
  );
}
