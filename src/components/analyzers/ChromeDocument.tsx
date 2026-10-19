import type { DocumentPageSize } from "@/lib/analyzers/document-chrome";

export function ChromeDocument({
  html,
  css,
  className,
  pageSize = "A4",
  pageMargin = "0",
}: {
  html: string;
  css: string;
  className: string;
  pageSize?: DocumentPageSize;
  pageMargin?: string;
}) {
  const pageCss = `@media print { @page { size: ${pageSize}; margin: ${pageMargin}; } }`;
  return (
    <div className={`${className} mx-auto w-[210mm] max-w-full`}>
      <style dangerouslySetInnerHTML={{ __html: `${pageCss}\n${css}` }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
