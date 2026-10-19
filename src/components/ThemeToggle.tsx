"use client";

import { useEffect, useState } from "react";

function isDarkNow() {
  return document.documentElement.classList.contains("dark");
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  try {
    localStorage.setItem("hadiran-theme", dark ? "dark" : "light");
  } catch {
    // ignore
  }
}

function StudyLamp({ on }: { on: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${on ? "text-[#D99B26]" : "text-current"}`}
      aria-hidden="true"
    >
      {on ? (
        <path
          d="M4.077 10.615A1 1 0 0 0 5 12h14a1 1 0 0 0 .923-1.385l-3.077-7.384A2 2 0 0 0 15 2H9a2 2 0 0 0-1.846 1.23Z"
          fill="#D99B26"
          fillOpacity="0.35"
        />
      ) : null}
      <path d="M12 12v6" />
      <path d="M4.077 10.615A1 1 0 0 0 5 12h14a1 1 0 0 0 .923-1.385l-3.077-7.384A2 2 0 0 0 15 2H9a2 2 0 0 0-1.846 1.23Z" />
      <path d="M8 20a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDarkNow());
  }, []);

  const label = dark ? "چراغ مطالعه شب" : "نور روز";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={dark}
      title={label}
      onClick={() => {
        const next = !isDarkNow();
        applyTheme(next);
        setDark(next);
      }}
      className="cursor-pointer rounded-xl border border-line bg-elev p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
    >
      <StudyLamp on={dark} />
    </button>
  );
}
