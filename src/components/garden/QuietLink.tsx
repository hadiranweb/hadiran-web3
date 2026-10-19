"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";

export function QuietLink({ href, children }: { href: string; children: ReactNode }) {
  const line = useRef<HTMLSpanElement>(null);
  const animation = useRef<Animation | null>(null);

  function ink(enter: boolean) {
    animation.current?.cancel();
    if (!line.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animation.current = line.current.animate([
      { opacity: enter ? .35 : 1, transform: `scaleX(${enter ? .6 : 1})` },
      { opacity: enter ? 1 : .35, transform: `scaleX(${enter ? 1 : .6})` },
    ], { duration: 180, easing: "ease-out", fill: "forwards" });
  }

  return (
    <Link prefetch={false} href={href} className="gw-ink"
      onPointerEnter={() => ink(true)} onPointerLeave={() => ink(false)}
      onFocus={() => ink(true)} onBlur={() => ink(false)}>
      {children}<span ref={line} className="gw-ink-line" aria-hidden="true" />
    </Link>
  );
}
