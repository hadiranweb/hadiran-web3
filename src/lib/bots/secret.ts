import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

function key(): Buffer {
  const secret = process.env.HADIRAN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("missing_secret");
  }
  return createHash("sha256").update(`hadiran-bot:${secret}`).digest();
}

export function canSealBotSecrets(): boolean {
  const secret = process.env.HADIRAN_JWT_SECRET;
  return Boolean(secret && secret.length >= 32);
}

export function sealSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function openSecret(sealed: string): string {
  const buf = Buffer.from(sealed, "base64url");
  if (buf.length < 29) throw new Error("bad_secret");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function newBotId(): string {
  return randomBytes(12).toString("hex");
}

export function newWebhookSecret(): string {
  return randomBytes(24).toString("base64url").replace(/=+$/g, "");
}

export function secretsMatch(given: string | null, expected: string): boolean {
  if (!given) return false;
  const left = Buffer.from(given);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function tokenHintOf(token: string): string {
  const trimmed = token.trim();
  return trimmed.slice(-4);
}
