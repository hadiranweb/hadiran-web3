export type AuthoringQuotaWindow = {
  quotaTotal: number;
  quotaUsed: number;
  startsAt?: Date;
  endsAt: Date;
};

export function selectAuthoringQuotaWindow<T extends AuthoringQuotaWindow>(rows: readonly T[]) {
  const ordered = [...rows].sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  if (!ordered.length) return { ok: false as const, error: "subscription_required" as const };
  const window = ordered.find((row) => row.quotaUsed < row.quotaTotal);
  if (!window) return { ok: false as const, error: "quota_exhausted" as const };
  return { ok: true as const, window };
}

export function summarizeAuthoringQuota<T extends AuthoringQuotaWindow>(rows: readonly T[]) {
  const usable = [...rows]
    .filter((row) => row.quotaUsed < row.quotaTotal)
    .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  return {
    remaining: usable.reduce((total, row) => total + row.quotaTotal - row.quotaUsed, 0),
    activeSubscriptions: rows.length,
    nextExpiry: usable[0]?.endsAt.toISOString() ?? null,
  };
}
