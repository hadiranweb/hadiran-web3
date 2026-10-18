import type { AccountRole } from "@/lib/auth/roles";

type WorkspaceIdentity = { role: AccountRole; analyzerDesk?: boolean };

export function workspaceScope(account: WorkspaceIdentity): "owner" | "author" | "delegated" | "member" {
  if (account.role === "owner" || account.role === "author") return account.role;
  return account.analyzerDesk ? "delegated" : "member";
}

export function workspaceHome(account: WorkspaceIdentity): string {
  const scope = workspaceScope(account);
  return scope === "owner" ? "/workspace" : scope === "member" ? "/account" : "/workspace/analyzers";
}

export function safeReturnPath(value: unknown, fallback = "/"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    && !/[\\\u0000-\u0020\u007f]/.test(value) && !/^\/signin(?:[/?#]|$)/.test(value)
    ? value : fallback;
}
