"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function SiteChrome({ children, navigation, footer }: { children: ReactNode; navigation: ReactNode; footer: ReactNode }) {
  const path = usePathname();
  if (path === "/workspace" || path.startsWith("/workspace/")) return <>{children}</>;
  return <>{navigation}<div className="flex-1">{children}</div>{footer}</>;
}
