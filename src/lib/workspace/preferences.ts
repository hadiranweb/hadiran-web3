export function workspacePreferenceKey(accountId: number, preference: "sidebar" | "locale"): string {
  return `hadiran-workspace-${accountId === 0 ? "preview" : accountId}-${preference}`;
}
