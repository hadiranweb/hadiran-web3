import { cookies } from "next/headers";
import { db } from "@/db";
import { accounts, sessions } from "@/db/schema";
import { and, eq, isNull, gt } from "drizzle-orm";
import { hashSecret, randomSessionToken } from "./crypto";
import { SESSION_COOKIE, SESSION_DAYS, isProduction, ownerPhones } from "./config";
import { needsPasswordSetup } from "./password";
import { requestIp, requestUserAgent } from "./request";
import { assertJwtReadyForIssue, jwtConfigured, sessionJtiFromCookie, signSessionJwt } from "./jwt";

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
    secure: isProduction(),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function createSession(accountId: number, meta?: { ip?: string; userAgent?: string | null }) {
  assertJwtReadyForIssue();
  const jti = randomSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    accountId,
    tokenHash: hashSecret(jti),
    expiresAt,
    ipAddress: meta?.ip ?? null,
    userAgent: meta?.userAgent ?? null,
    lastSeenAt: new Date(),
  });
  if (jwtConfigured()) {
    return signSessionJwt({
      sub: String(accountId),
      jti,
      exp: Math.floor(expiresAt.getTime() / 1000),
    });
  }
  return jti;
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
    const parsed = sessionJtiFromCookie(token);
    if (!parsed) return null;
    const tokenHash = hashSecret(parsed.jti);
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
          eq(accounts.isActive, true),
        ),
      )
      .limit(1);

    if (!row) return null;
    if (parsed.accountId && parsed.accountId !== row.id) return null;

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
    const parsed = sessionJtiFromCookie(token);
    const jti = parsed?.jti || token;
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, hashSecret(jti)));
  } catch {
    // local logout still proceeds
  }
  await clearSessionCookie();
}

export function roleForPhone(phone: string): "owner" | "member" {
  return ownerPhones().has(phone) ? "owner" : "member";
}

export type LoginAccount = SessionAccount & { passwordHash: string | null };

export async function completePhoneLogin(input: {
  phone: string;
  request: Request;
}): Promise<{ account: LoginAccount; needs_password: boolean }> {
  const role = roleForPhone(input.phone);
  const [existing] = await db.select().from(accounts).where(eq(accounts.phone, input.phone)).limit(1);
  let account = existing;
  if (!account) {
    const [created] = await db
      .insert(accounts)
      .values({
        phone: input.phone,
        role,
        phoneVerifiedAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true,
      })
      .returning();
    account = created;
  } else {
    if (!account.isActive) {
      const error = new Error("account_disabled");
      error.name = "AccountDisabledError";
      throw error;
    }
    const [updated] = await db
      .update(accounts)
      .set({
        phoneVerifiedAt: account.phoneVerifiedAt ?? new Date(),
        lastLoginAt: new Date(),
        role: account.role === "owner" ? "owner" : role,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, account.id))
      .returning();
    account = updated;
  }

  if (!account) {
    throw new Error("account_missing");
  }

  const token = await createSession(account.id, {
    ip: requestIp(input.request),
    userAgent: requestUserAgent(input.request),
  });
  await setSessionCookie(token);

  return {
    account: {
      id: account.id,
      phone: account.phone,
      displayName: account.displayName,
      role: account.role,
      passwordHash: account.passwordHash,
    },
    needs_password: needsPasswordSetup({ phone: account.phone, passwordHash: account.passwordHash }),
  };
}
