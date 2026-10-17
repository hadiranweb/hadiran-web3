"use client";

import { Moon, Sun } from "lucide-react";
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

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDarkNow());
  }, []);

  return (
    <button
      type="button"
      aria-label={dark ? "تم روشن" : "تم تاریک"}
      title={dark ? "تم روشن" : "تم تاریک"}
      onClick={() => {
        const next = !isDarkNow();
        applyTheme(next);
        setDark(next);
      }}
      className="rounded-[var(--radius-sm)] p-2 text-muted hover:bg-elev hover:text-ink"
    >
      {dark ? <Sun className="h-5 w-5" strokeWidth={1.5} /> : <Moon className="h-5 w-5" strokeWidth={1.5} />}
    </button>
  );
}
