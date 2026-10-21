import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageOwner } from "@/lib/auth/guard";
import { loadCopyGroup } from "@/lib/content/desk";
import { GROUP_LABELS, isCopyGroup } from "@/lib/content/registry";
import { CopyGroupEditor } from "@/components/workspace/CopyGroupEditor";
import { PublicSourceNotice } from "@/components/ui/PublicSourceNotice";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }): Promise<Metadata> {
  const { group } = await params;
  const title = isCopyGroup(group) ? GROUP_LABELS[group].title : "متن";
  return { title: `متن — ${title}`, robots: { index: false, follow: false } };
}

export default async function CopyGroupPage({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  if (!isCopyGroup(group)) notFound();
  await requirePageOwner(`/workspace/content/copy/${group}`);
  const { source, entries } = await loadCopyGroup(group);
  const meta = GROUP_LABELS[group];

  return (
    <div className="ws-page">
      <header className="ws-page-heading">
        <div>
          <p className="ws-overline">
            <Link href="/workspace/content" className="hover:text-ink">
              متن و نام
            </Link>
          </p>
          <h1>{meta.title}</h1>
          <p>{meta.hint}</p>
        </div>
      </header>

      <PublicSourceNotice source={source} />
      <CopyGroupEditor group={group} entries={entries} disabled={source !== "live"} />
    </div>
  );
}
