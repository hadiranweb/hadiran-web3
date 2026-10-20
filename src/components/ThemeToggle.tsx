"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { DISCLOSURE_EVENT } from "@/components/navigation/useDisclosure";

const KEY = "hadiran-theme";
const EVENT = "hadiran-theme-change";

type Preference = "light" | "dark" | "system";

const options = [
  { value: "light", fa: "روشن", en: "Light" },
  { value: "dark", fa: "تاریک", en: "Dark" },
  { value: "system", fa: "مطابق سیستم", en: "System" },
] as const;

function storedPreference(value: string | null | undefined): Preference {
  return value === "light" || value === "dark" ? value : "system";
}

function resolvedTheme(preference: Preference): "light" | "dark" {
  if (preference === "light" || preference === "dark") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemePreference(preference: Preference) {
  const root = document.documentElement;
  const resolved = resolvedTheme(preference);
  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

function getPreference(): Preference {
  return storedPreference(document.documentElement.dataset.themePreference);
}

function subscribe(notify: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    applyThemePreference(getPreference());
    notify();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY && event.key !== null) return;
    applyThemePreference(storedPreference(event.newValue));
    notify();
  };
  applyThemePreference(getPreference());
  window.addEventListener(EVENT, notify);
  window.addEventListener("storage", onStorage);
  media.addEventListener("change", onSystem);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onSystem);
  };
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

export function ThemeToggle({
  className,
  locale = "fa",
}: {
  className?: string;
  locale?: "fa" | "en";
}) {
  const groupName = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const t = (fa: string, en: string) => (locale === "en" ? en : fa);
  const preference = useSyncExternalStore(subscribe, getPreference, () => "system" as Preference);
  const active = options.find((option) => option.value === preference) ?? options[2];
  const lampOn = preference === "dark";

  useEffect(() => {
    const node = detailsRef.current;
    if (!node) return;
    const onPointer = (event: Event) => {
      if (!node.contains(event.target as Node)) node.removeAttribute("open");
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && node.open) {
        node.removeAttribute("open");
        node.querySelector("summary")?.focus();
      }
    };
    const onOther = (event: Event) => {
      if ((event as CustomEvent).detail !== `theme-${groupName}`) node.removeAttribute("open");
    };
    document.addEventListener("focusin", onPointer);
    window.addEventListener(DISCLOSURE_EVENT, onOther);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("focusin", onPointer);
      window.removeEventListener(DISCLOSURE_EVENT, onOther);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [groupName]);

  function choose(value: Preference) {
    applyThemePreference(value);
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* Keep the choice for this page if storage is blocked. */
    }
    window.dispatchEvent(new Event(EVENT));
    detailsRef.current?.removeAttribute("open");
  }

  const selectedLabel = t(active.fa, active.en);

  return (
    <details
      className="theme-switcher"
      ref={detailsRef}
      onToggle={(event) => {
        if (event.currentTarget.open) {
          window.dispatchEvent(new CustomEvent(DISCLOSURE_EVENT, { detail: `theme-${groupName}` }));
        }
      }}
    >
      <summary
        className={
          className ??
          "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-elev p-2 text-muted transition-colors hover:bg-paper hover:text-ink"
        }
        aria-label={t(`تغییر تم؛ انتخاب فعلی: ${active.fa}`, `Change appearance; selected: ${selectedLabel}`)}
        title={selectedLabel}
      >
        <StudyLamp on={lampOn} />
      </summary>
      <fieldset className="theme-options">
        <legend className="sr-only">{t("ظاهر سایت", "Appearance")}</legend>
        <p className="theme-options-heading" aria-hidden="true">
          {t("ظاهر سایت", "Appearance")}
        </p>
        {options.map((option) => (
          <label className="theme-option" key={option.value}>
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={preference === option.value}
              onChange={() => choose(option.value)}
            />
            <span>{t(option.fa, option.en)}</span>
            {preference === option.value ? (
              <span className="theme-option-check" aria-hidden="true">
                ✓
              </span>
            ) : null}
          </label>
        ))}
      </fieldset>
    </details>
  );
}
