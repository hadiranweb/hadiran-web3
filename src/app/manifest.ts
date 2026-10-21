import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getSiteCopy } from "@/lib/content/site-copy";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const copy = await getSiteCopy();
  return {
    name: copy.voice.browserTitle,
    short_name: copy.site.nameFa,
    description: copy.voice.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f6f2",
    theme_color: "#f7f6f2",
    lang: "fa",
    dir: "rtl",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
