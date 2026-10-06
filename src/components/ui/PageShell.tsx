import type { ReactNode } from "react";

const widths = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-6xl",
} as const;

export function PageShell({
  children,
  width = "default",
  className = "",
}: {
  children: ReactNode;
  width?: keyof typeof widths;
  className?: string;
}) {
  return <main className={`mx-auto ${widths[width]} px-4 py-10 ${className}`}>{children}</main>;
}
