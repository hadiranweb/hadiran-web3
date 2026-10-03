import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ownerPassword, ownerPasswordConfigured, ownerPhones } from "./config";

const scryptAsync = promisify(scrypt);

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;
const KEY_LENGTH = 32;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_LENGTH) return "password_too_short";
  if (password.length > MAX_LENGTH) return "password_too_long";
  if (/\s/.test(password)) return "password_has_space";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scryptAsync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })) as Buffer;
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyStoredPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts[0] !== "scrypt" || parts.length !== 6) return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  const salt = Buffer.from(parts[4], "hex");
  const expected = Buffer.from(parts[5], "hex");
  if (!salt.length || !expected.length) return false;
  const key = (await scryptAsync(password, salt, expected.length, { N: n, r, p })) as Buffer;
  if (key.length !== expected.length) return false;
  return timingSafeEqual(key, expected);
}

export function verifyOwnerEnvPassword(password: string): boolean {
  const expected = ownerPassword();
  if (!expected) return false;
  const a = createHmac("sha256", "hadiran-owner-password").update(password).digest();
  const b = createHmac("sha256", "hadiran-owner-password").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function phoneHasOwnerEnvPassword(phone: string) {
  return ownerPhones().has(phone) && ownerPasswordConfigured();
}

export function needsPasswordSetup(input: { phone: string; passwordHash: string | null }) {
  if (input.passwordHash) return false;
  if (phoneHasOwnerEnvPassword(input.phone)) return false;
  return true;
}
