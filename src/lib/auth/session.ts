import { cookies } from "next/headers";
import { db } from "@/db";
import { accounts, sessions } from "@/db/schema";
import { and, eq, isNull, gt } from "drizzle-orm";
import { hashSecret, randomSessionToken } from "./crypto";
import { SESSION_COOKIE, SESSION_DAYS, ownerPhones } from "./config";

export type SessionAccount = {
  id: number;
  phone: string;
  displayName: string | null;
  role: "owner" | "member";
};

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function createSession(accountId: number, meta?: { ip?: string; userAgent?: string | null }) {
  const token = randomSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    accountId,
    tokenHash: hashSecret(token),
    expiresAt,
    ipAddress: meta?.ip ?? null,
    userAgent: meta?.userAgent ?? null,
    lastSeenAt: new Date(),
  });
  return token;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
}

export async function readSessionToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value || null;
}

export async function getCurrentAccount(): Promise<SessionAccount | null> {
  const token = await readSessionToken();
  if (!token) return null;
  try {
    const tokenHash = hashSecret(token);
    const [row] = await db
      .select({
        id: accounts.id,
        phone: accounts.phone,
        displayName: accounts.displayName,
        role: accounts.role,
        sessionId: sessions.id,
      })
      .from(sessions)
      .innerJoin(accounts, eq(sessions.accountId, accounts.id))
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date()),
          eq(accounts.isActive, true)
        )
      )
      .limit(1);

    if (!row) return null;

    await db
      .update(sessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(sessions.id, row.sessionId));

    return {
      id: row.id,
      phone: row.phone,
      displayName: row.displayName,
      role: row.role,
    };
  } catch {
    return null;
  }
}

export async function revokeCurrentSession() {
  const token = await readSessionToken();
  if (!token) return;
  try {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, hashSecret(token)));
  } catch {
    // local logout still proceeds
  }
  await clearSessionCookie();
}

export function roleForPhone(phone: string): "owner" | "member" {
  return ownerPhones().has(phone) ? "owner" : "member";
}
