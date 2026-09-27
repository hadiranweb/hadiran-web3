import type { Metadata } from "next";
import { WorkspaceChrome } from "@/components/workspace/WorkspaceChrome";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WorkspaceChrome />
      {children}
    </>
  );
}
