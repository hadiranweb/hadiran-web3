"use client";
import Image from "next/image";
import { useState } from "react";
import { avatarPath } from "@/lib/account/avatar";
export function UserAvatar({ variant = 0, photoUrl, size = 40, className = "" }: { variant?: number; photoUrl?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = photoUrl && failed !== photoUrl ? photoUrl : avatarPath(variant);
  return <Image className={`user-avatar ${className}`} unoptimized src={src} width={size} height={size} alt="" aria-hidden="true" onError={() => setFailed(photoUrl || "")} />;
}
