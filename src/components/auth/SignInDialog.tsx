"use client";

import { useEffect } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export function SignInDialog({
  open,
  onClose,
  onAuthenticated,
  nextPath,
}: {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  nextPath: string;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[color-mix(in_srgb,var(--ink)_45%,transparent)] p-4">
      <button type="button" aria-label="بستن ورود" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-dialog-title"
        className="surface relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-3">
          <h2 id="signin-dialog-title" className="text-sm font-medium text-ink">
            ورود
          </h2>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-ink">
            بستن
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-5 text-sm leading-7 text-muted">
            شماره را بگذار. اگر رمز ثابت دارید با رمز وارد شوید؛ وگرنه کد پیامکی می‌آید. گذاشتن رمز هنگام ثبت‌نام لازم
            نیست.
          </p>
          <SignInForm nextPath={nextPath} onAuthenticated={onAuthenticated} hideHint />
        </div>
      </div>
    </div>
  );
}
