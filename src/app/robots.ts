import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/*/collaborate", "/knowledge/new", "/*/edit", "/signin", "/workspace", "/workspace/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
