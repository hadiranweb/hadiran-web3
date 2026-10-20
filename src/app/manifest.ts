import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { voice } from "@/lib/copy";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: voice.browserTitle,
    short_name: siteConfig.nameFa,
    description: voice.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf9f5",
    theme_color: "#fbf9f5",
    lang: "fa",
    dir: "rtl",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
