/**
 * Guard the one-time 0037 schema rebuild. A legacy CLI flag is not approval.
 * Production is always fail-closed; non-production requires a separate explicit
 * confirmation in addition to --allow-destructive-reset.
 */
export function shouldBlockDestructiveRebuild({ isProduction, markerApplied, explicitlyConfirmed }) {
  if (markerApplied) return false;
  return Boolean(isProduction) || !Boolean(explicitlyConfirmed);
}
