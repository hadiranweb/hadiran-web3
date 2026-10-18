import type { SVGProps } from "react";

interface HadiranMarkProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function HadiranMark({ size = 28, className = "", style, ...props }: HadiranMarkProps) {
  const dimension = typeof size === "number" ? `${size}px` : size;

  return (
    <svg
      {...props}
      viewBox="0 0 44 44"
      width={dimension}
      height={dimension}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`hadiran-mark shrink-0 ${className}`}
      aria-hidden="true"
      style={{ width: dimension, height: dimension, ...style }}
    >
      <rect x="4" y="4" width="36" height="36" rx="10" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M14 22C14 17.5817 17.5817 14 22 14C26.4183 14 30 17.5817 30 22V30H14V22Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="22" r="3" fill="currentColor" />
    </svg>
  );
}
