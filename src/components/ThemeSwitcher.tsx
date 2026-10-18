"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";

const KEY = "hadiran-theme";
const EVENT = "hadiran-theme-change";
type Preference = "light" | "dark" | "system";
const options = [
  { value: "light", label: "روشن", icon: Sun },
  { value: "dark", label: "تاریک", icon: Moon },
  { value: "system", label: "مطابق سیستم", icon: Monitor },
] as const;

function getPreference(): Preference {
  const value = document.documentElement.dataset.themePreference;
  return value === "light" || value === "dark" ? value : "system";
}

function apply(preference: Preference) {
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = preference === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  root.classList.toggle("dark", root.dataset.theme === "dark");
}

function subscribe(notify: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => { apply(getPreference()); notify(); };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY && event.key !== null) return;
    apply(event.newValue === "light" || event.newValue === "dark" ? event.newValue : "system");
    notify();
  };
  apply(getPreference());
  window.addEventListener(EVENT, notify);
  window.addEventListener("storage", onStorage);
  media.addEventListener("change", onSystem);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onSystem);
  };
}

export function ThemeSwitcher({ locale = "fa" }: { locale?: "fa" | "en" }) {
  const groupName = useId();
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const optionLabel = (value: string, label: string) => t(label, value === "light" ? "Light" : value === "dark" ? "Dark" : "System");
  const preference = useSyncExternalStore(subscribe, getPreference, () => "system" as Preference);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const active = options.find((option) => option.value === preference)!;
  const Icon = active.icon;

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!detailsRef.current?.contains(event.target as Node)) detailsRef.current?.removeAttribute("open");
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.removeAttribute("open");
        detailsRef.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function choose(value: Preference) {
    apply(value);
    try { localStorage.setItem(KEY, value); } catch { /* Keep the choice for this page if storage is blocked. */ }
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <details className="theme-switcher" ref={detailsRef}>
      <summary className="theme-trigger" aria-label={t(`تغییر تم؛ انتخاب فعلی: ${active.label}`, `Change appearance; selected: ${optionLabel(active.value, active.label)}`)} title={optionLabel(active.value, active.label)}>
        <Icon size={17} aria-hidden="true" />
      </summary>
      <fieldset className="theme-options">
        <legend className="sr-only">{t("ظاهر سایت", "Appearance")}</legend>
        <p className="theme-options-heading" aria-hidden="true">{t("ظاهر سایت", "Appearance")}</p>
        {options.map((option) => {
          const OptionIcon = option.icon;
          return (
            <label className="theme-option" key={option.value}>
              <input type="radio" name={groupName} value={option.value} checked={preference === option.value} onChange={() => choose(option.value)} />
              <OptionIcon size={16} aria-hidden="true" />
              <span>{optionLabel(option.value, option.label)}</span>
              {preference === option.value ? <Check size={15} className="theme-option-check" aria-hidden="true" /> : null}
            </label>
          );
        })}
      </fieldset>
    </details>
  );
}
