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
      {kicker ? <p className="mb-2 text-sm font-medium text-mark">{kicker}</p> : null}
      <h1 className="text-3xl font-extrabold leading-[1.35] tracking-tight text-ink sm:text-4xl">{title}</h1>
      {lede ? (
        <p className={`mt-3 max-w-2xl text-base leading-[1.85] text-muted ${align === "center" ? "mx-auto" : ""}`}>
          {lede}
        </p>
      ) : null}
      {children}
    </header>
  );
}
