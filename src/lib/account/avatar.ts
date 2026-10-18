/** Public, fixed illustrations. No phone number, face recognition, third-party avatar service or PII in URLs. */
export const AVATAR_COUNT = 8;
export type AccountAvatar = { variant: number; photoUrl: string | null };
export function defaultAvatarVariant(accountId: number): number {
  let hash = 2166136261;
  for (const character of `hadiran-avatar-v1:${accountId}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0) % AVATAR_COUNT;
}
export function avatarPath(variant: number) {
  const safe = Number.isInteger(variant) && variant >= 0 && variant < AVATAR_COUNT ? variant : 0;
  return `/avatars/avatar-${String(safe + 1).padStart(2, "0")}.svg`;
}
