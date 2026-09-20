import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function randomSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function sixDigitCode() {
  const n = randomBytes(4).readUInt32BE(0) % 900000;
  return String(100000 + n);
}

export function hashesMatch(expectedHex: string, actualHex: string) {
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
