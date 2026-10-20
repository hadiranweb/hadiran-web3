"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export const DISCLOSURE_EVENT = "hadiran:disclosure-open";

/** Non-modal disclosure: Tab through links, WAAPI-only motion, cancellable exit. */
export function useDisclosure<T extends HTMLElement = HTMLDivElement>() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const panel = useRef<T>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const animation = useRef<Animation | null>(null);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }, []);

  const show = useCallback(() => {
    window.dispatchEvent(new CustomEvent(DISCLOSURE_EVENT, { detail: id }));
    setVisible(true);
    setOpen(true);
  }, [id]);

  const toggle = () => (open ? close() : show());

  useLayoutEffect(() => {
    const node = panel.current;
    if (!node || !visible) return;
    const previous = animation.current;
    const current = previous
      ? { opacity: getComputedStyle(node).opacity, transform: getComputedStyle(node).transform }
      : null;
    previous?.cancel();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = current || (open
      ? { opacity: "0", transform: "translateY(-12px) scale(.985)" }
      : { opacity: "1", transform: "translateY(0) scale(1)" });
    const to = open
      ? { opacity: "1", transform: "translateY(0) scale(1)" }
      : { opacity: "0", transform: "translateY(-12px) scale(.985)" };
    const motion = node.animate(reduce ? [{ opacity: from.opacity }, { opacity: to.opacity }] : [from, to], {
      duration: reduce ? 1 : open ? 340 : 230,
      easing: open ? "cubic-bezier(.16,1,.3,1)" : "cubic-bezier(.4,0,1,1)",
      fill: "both",
    });
    animation.current = motion;
    motion.onfinish = () => {
      animation.current = null;
      if (!open) setVisible(false);
      motion.cancel();
    };
    return () => {
      motion.onfinish = null;
    };
  }, [open, visible]);

  useEffect(() => () => {
    animation.current?.cancel();
  }, []);

  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) close();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };
    const other = (event: Event) => {
      if ((event as CustomEvent).detail !== id) close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", key);
    window.addEventListener(DISCLOSURE_EVENT, other);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", key);
      window.removeEventListener(DISCLOSURE_EVENT, other);
    };
  }, [open, close, id]);

  return { id, open, visible, panel, trigger, toggle, close, show };
}
