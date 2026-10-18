"use client";
import NextLink from "next/link";
import { useSyncExternalStore, type ComponentProps } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { PREVIEW_SESSION_KEY } from "@/lib/auth/preview-client";
import { withPreviewAccess } from "@/lib/auth/preview-url";
const subscribe = () => () => {};
function snapshot() {
  try { return new URL(window.location.href).searchParams.get("preview_access") || sessionStorage.getItem(PREVIEW_SESSION_KEY) || ""; } catch { return ""; }
}
export default function WorkspaceLink(props: ComponentProps<typeof NextLink>) {
  const { previewTicket } = useWorkspace();
  const clientTicket = useSyncExternalStore(subscribe, snapshot, () => "");
  const href = typeof props.href === "string" ? withPreviewAccess(props.href, previewTicket || clientTicket) : props.href;
  return <NextLink {...props} href={href} />;
}
