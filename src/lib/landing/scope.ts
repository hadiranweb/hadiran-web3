import "server-only";
import type { SessionAccount } from "@/lib/auth/session";
/** Namespace only: local storage is not encrypted, private or synchronized. */
export function browserScope(account: SessionAccount | null) {
  return !account ? "guest" : account.id === 0 ? "preview-owner" : `account-${account.id}`;
}
