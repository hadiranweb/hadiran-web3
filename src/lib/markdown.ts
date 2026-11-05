function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[character] || character;
  });
}

function inline(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" rel="noreferrer noopener" target="_blank">$1</a>'
    );
}

export function markdownHeadings(source: string) {
  let inCode = false;
  return source.replace(/\r\n?/g, "\n").split("\n").flatMap((line, index) => {
    if (line.trim().startsWith("```")) { inCode = !inCode; return []; }
    const match = !inCode && line.match(/^(#{1,3})\s+(.+)$/);
    return match ? [{ id: `section-${index + 1}`, text: match[2], level: match[1].length }] : [];
  });
}

export function renderMarkdown(source: string, headingAnchors = false): string {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const output: string[] = [];
  let inCode = false;
  let code: string[] = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      output.push("</ul>");
      listOpen = false;
    }
  };

  for (const [index, line] of lines.entries()) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}${headingAnchors ? ` id="section-${index + 1}"` : ""}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (item) {
      if (!listOpen) {
        output.push("<ul>");
        listOpen = true;
      }
      output.push(`<li>${inline(item[1])}</li>`);
      continue;
    }
    closeList();
    output.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  if (inCode) output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return output.join("");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
