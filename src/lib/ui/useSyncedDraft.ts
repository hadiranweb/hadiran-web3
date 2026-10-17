"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearDraft, readDraft, writeDraft } from "./draft";

function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** پیش‌نویس تب: F5 نگه می‌دارد؛ اگر کاربر تایپ نکرده، مقدار سرور می‌آید. رمز/OTP اینجا نگذار. */
export function useSyncedDraft<T>(storageKey: string, server: T) {
  const serverKey = JSON.stringify(server);
  const [value, setValue] = useState(server);
  const dirtyRef = useRef(false);
  const serverRef = useRef(server);
  serverRef.current = server;

  useEffect(() => {
    const draft = readDraft<T>(storageKey);
    if (draft != null && !same(draft, serverRef.current)) {
      dirtyRef.current = true;
      setValue(draft);
      return;
    }
    dirtyRef.current = false;
    setValue(serverRef.current);
  }, [storageKey]);

  useEffect(() => {
    if (dirtyRef.current) return;
    setValue(serverRef.current);
  }, [serverKey]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        dirtyRef.current = !same(resolved, serverRef.current);
        if (dirtyRef.current) writeDraft(storageKey, resolved);
        else clearDraft(storageKey);
        return resolved;
      });
    },
    [storageKey],
  );

  const markSaved = useCallback(
    (next: T) => {
      dirtyRef.current = false;
      serverRef.current = next;
      setValue(next);
      clearDraft(storageKey);
    },
    [storageKey],
  );

  return { value, set, markSaved };
}
