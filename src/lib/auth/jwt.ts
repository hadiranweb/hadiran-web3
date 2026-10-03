import { createHmac, timingSafeEqual } from "node:crypto";
import { isProduction } from "./config";

const MIN_SECRET_LENGTH = 32;

export function jwtSecret(): string {
  return process.env.HADIRAN_JWT_SECRET?.trim() || "";
}

export function jwtConfigured() {
  return jwtSecret().length >= MIN_SECRET_LENGTH;
}

export function assertJwtReadyForIssue() {
  if (isProduction() && !jwtConfigured()) {
    const error = new Error("jwt_not_configured");
    error.name = "JwtSecretMissingError";
    throw error;
  }
}

type SessionClaims = {
  sub: string;
  jti: string;
  exp: number;
};

function utf8Json(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function hmac(data: string, secret: string) {
  return createHmac("sha256", secret).update(data).digest();
}

export function signSessionJwt(input: SessionClaims): string {
  const secret = jwtSecret();
  if (secret.length < MIN_SECRET_LENGTH) {
    const error = new Error("jwt_not_configured");
    error.name = "JwtSecretMissingError";
    throw error;
  }
  const header = utf8Json({ alg: "HS256", typ: "JWT" });
  const payload = utf8Json({
    iss: "hadiran",
    sub: input.sub,
    jti: input.jti,
    exp: input.exp,
  });
  const body = `${header}.${payload}`;
  const signature = hmac(body, secret).toString("base64url");
  return `${body}.${signature}`;
}

function decodePart(part: string): unknown {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function verifySessionJwt(token: string): SessionClaims | null {
  const secret = jwtSecret();
  if (secret.length < MIN_SECRET_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodePart(headerPart) as { alg?: string; typ?: string } | null;
  if (!header || header.alg !== "HS256" || header.typ !== "JWT") return null;

  let actual: Buffer;
  try {
    actual = Buffer.from(signaturePart, "base64url");
  } catch {
    return null;
  }
  const expected = hmac(`${headerPart}.${payloadPart}`, secret);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  const payload = decodePart(payloadPart) as {
    iss?: string;
    sub?: unknown;
    jti?: unknown;
    exp?: unknown;
  } | null;
  if (!payload || payload.iss !== "hadiran") return null;
  if (typeof payload.sub !== "string" || !/^\d+$/.test(payload.sub)) return null;
  if (typeof payload.jti !== "string" || payload.jti.length < 16) return null;
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return null;
  if (payload.exp * 1000 <= Date.now() - 30_000) return null;
  return { sub: payload.sub, jti: payload.jti, exp: payload.exp };
}

export function sessionJtiFromCookie(token: string): { jti: string; accountId?: number } | null {
  if (token.split(".").length === 3) {
    const claims = verifySessionJwt(token);
    if (!claims) return null;
    return { jti: claims.jti, accountId: Number(claims.sub) };
  }
  if (token.length >= 16) return { jti: token };
  return null;
}
