export function ChromeDocument({
  html,
  css,
  className,
}: {
  html: string;
  css: string;
  className: string;
}) {
  return (
    <div className={`${className} mx-auto w-[210mm] max-w-full`}>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
