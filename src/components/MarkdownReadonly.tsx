import { renderMarkdown } from "@/lib/markdown";

type MarkdownReadonlyProps = {
  source?: string | null;
  className?: string;
  dir?: "rtl" | "ltr" | "auto";
  emptyLabel?: string;
};

export function MarkdownReadonly({
  source,
  className = "",
  dir = "rtl",
  emptyLabel = "محتوایی ثبت نشده است.",
}: MarkdownReadonlyProps) {
  if (!source?.trim()) {
    return <p className={`text-sm text-slate-400 ${className}`}>{emptyLabel}</p>;
  }

  return (
    <div
      className={`prose-reading ${className}`}
      dir={dir}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
    />
  );
}
