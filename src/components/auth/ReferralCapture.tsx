"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralCapture() {
  const params = useSearchParams();
  useEffect(() => {
    const ref = params.get("ref");
    if (ref && /^\d{8}$/.test(ref.replace(/\s+/g, ""))) {
      try { sessionStorage.setItem("hadiran-ref", ref.replace(/\s+/g, "")); } catch {}
    }
  }, [params]);
  return null;
}
