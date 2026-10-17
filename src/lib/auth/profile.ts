export function normalizePersonName(input: unknown, max = 64): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (trimmed.length > max) return null;
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return null;
  return trimmed;
}

export function displayNameFromParts(givenName: string | null, familyName: string | null): string | null {
  const joined = [givenName, familyName].filter(Boolean).join(" ").trim();
  if (!joined) return null;
  return joined.slice(0, 128);
}
