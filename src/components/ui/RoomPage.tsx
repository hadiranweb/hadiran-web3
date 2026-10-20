import type { ReactNode } from "react";

export function RoomPage({
  hero,
  children,
  compact = true,
}: {
  hero: ReactNode;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <main className="module-page">
      <section className={`page-hero ${compact ? "page-hero-compact" : ""}`}>
        <div className="aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="wrap">{hero}</div>
      </section>
      <div className="wrap">{children}</div>
    </main>
  );
}
