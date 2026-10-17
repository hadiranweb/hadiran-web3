import { privacyPolicyVersion } from "@/lib/privacy/version";

export function hasPersonName(givenName?: string | null, familyName?: string | null) {
  return Boolean(givenName?.trim() && familyName?.trim());
}

export function onboardingFlags(row: {
  givenName: string | null;
  familyName: string | null;
  policiesAcceptedAt: Date | null;
  policiesVersion: string | null;
}) {
  const policiesAccepted = Boolean(row.policiesAcceptedAt) && row.policiesVersion === privacyPolicyVersion();
  const needsProfile = !hasPersonName(row.givenName, row.familyName);
  return {
    policiesAccepted,
    needsProfile,
    onboardingComplete: policiesAccepted && !needsProfile,
  };
}
