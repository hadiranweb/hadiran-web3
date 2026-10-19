import type { AccountRole } from "./roles";

export const PERSON_WIPE_FIELDS = [
  "phone",
  "name",
  "telegram",
  "email",
  "password",
  "sessions",
  "otp",
  "auth_events",
  "attempts",
] as const;

export type PersonWipeField = (typeof PERSON_WIPE_FIELDS)[number];

export type PersonSummary = {
  publicCode: string;
  nameFa: string;
  phone: string | null;
  role: AccountRole;
  roleFa: string;
  isActive: boolean;
  referredBy: string | null;
  referredCount: number;
  createdAt: string | null;
  lastLoginAt: string | null;
  locked: boolean;
};

export type PersonLink = {
  publicCode: string;
  nameFa: string;
  roleFa: string;
};

export type PersonAttemptLink = {
  kind: "casio" | "analyzer";
  id: number;
  slug: string;
  takerCode: string;
  takerNameFa: string;
  referrerCode: string | null;
  direction: "they_used" | "used_theirs";
};

export type PersonDetail = PersonSummary & {
  givenName: string | null;
  familyName: string | null;
  email: string | null;
  telegramUserId: string | null;
  attemptCount: number;
  referred: PersonLink[];
  attempts: PersonAttemptLink[];
};
