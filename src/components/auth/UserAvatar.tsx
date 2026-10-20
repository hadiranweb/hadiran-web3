"use client";

import { avatarPath } from "@/lib/account/avatar";

export function UserAvatar({
  variant = 0,
  photoUrl,
  size = 40,
  className = "",
}: {
  variant?: number;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const src = photoUrl || avatarPath(variant);
  return (
    // Photo upload is off; SVG assets are local. Keep img so SVG colors stay intact.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`user-avatar ${className}`}
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  );
}
