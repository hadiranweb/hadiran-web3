import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  lede,
  children,
  align = "start",
}: {
  kicker?: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  align?: "start" | "center";
}) {
  return (
    <header className={`mb-10 ${align === "center" ? "text-center" : ""}`}>
      {kicker ? <p className={`eyebrow mb-3 ${align === "center" ? "mx-auto" : ""}`}>{kicker}</p> : null}
      <h1 className="title-xl text-ink">{title}</h1>
      {lede ? <p className={`lede mt-3 max-w-2xl ${align === "center" ? "mx-auto" : ""}`}>{lede}</p> : null}
      {children}
    </header>
  );
}
