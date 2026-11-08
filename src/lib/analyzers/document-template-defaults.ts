/** Built-in presentation defaults; no database, assessment runner or seed side effects. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HADIRAN_TEMPLATE_CSS, HADIRAN_TEMPLATE_HTML, SYSTEM_DIAGNOSIS_TEMPLATE_CSS, SYSTEM_DIAGNOSIS_TEMPLATE_HTML } from "./document-defaults";
import { CASIO_MATRIX_TEMPLATE_HTML, CASIO_MATRIX_TEMPLATE_CSS, CASIO_RESEARCH_TEMPLATE_HTML, CASIO_RESEARCH_TEMPLATE_CSS } from "./document-casio-defaults";
import { parseChrome, type DocumentChrome } from "./document-chrome";
import { canonicalizeTemplateId } from "./document-templates";

function readPublicSvg(rel: string): string {
  try {
    return readFileSync(join(process.cwd(), "public", rel), "utf8").replace(/<\?xml[^?]*\?>\s*/i, "");
  } catch {
    return "";
  }
}

export function defaultChrome(templateId: string): DocumentChrome {
  const id = canonicalizeTemplateId(templateId);
  if (id === "casio-ss" || id === "casio-research") {
    return {
      html: id === "casio-research" ? CASIO_RESEARCH_TEMPLATE_HTML : CASIO_MATRIX_TEMPLATE_HTML,
      css: id === "casio-research" ? CASIO_RESEARCH_TEMPLATE_CSS : CASIO_MATRIX_TEMPLATE_CSS,
      logos: {
        light: readPublicSvg("document-templates/casio/casio_logo_light.svg"),
        dark: readPublicSvg("document-templates/casio/casio_logo_dark.svg"),
        seal: readPublicSvg("document-templates/casio/casio_seal_red.svg"),
      },
      pageSize: "A4",
      pageMargin: "0",
    };
  }
  if (id === "system-diagnosis") {
    return {
      html: SYSTEM_DIAGNOSIS_TEMPLATE_HTML,
      css: HADIRAN_TEMPLATE_CSS + SYSTEM_DIAGNOSIS_TEMPLATE_CSS,
      logos: {
        light: readPublicSvg("brand/hadiran-mark.svg"),
        dark: readPublicSvg("brand/hadiran-mark.svg"),
        seal: readPublicSvg("brand/hadiran-mark.svg"),
      },
      pageSize: "A4",
      pageMargin: "0",
    };
  }
  return {
    html: HADIRAN_TEMPLATE_HTML,
    css: HADIRAN_TEMPLATE_CSS,
    logos: {
      light: readPublicSvg("brand/hadiran-mark.svg"),
      dark: readPublicSvg("brand/hadiran-mark.svg"),
      seal: readPublicSvg("brand/hadiran-mark.svg"),
    },
    pageSize: "A4",
    pageMargin: "0",
  };
}

export function mergeChrome(templateId: string, raw: unknown, baseRaw?: unknown): DocumentChrome {
  const fallback = baseRaw !== undefined ? mergeChrome(templateId, baseRaw) : defaultChrome(templateId);
  const parsed = parseChrome(raw);
  const html = parsed.html.trim() ? parsed.html : fallback.html;
  const css = parsed.css.trim() ? parsed.css : fallback.css;
  return {
    html,
    css,
    logos: {
      light: parsed.logos.light.trim() ? parsed.logos.light : fallback.logos.light,
      dark: parsed.logos.dark.trim() ? parsed.logos.dark : fallback.logos.dark,
      seal: parsed.logos.seal.trim() ? parsed.logos.seal : fallback.logos.seal,
    },
    pageSize: parsed.pageSize || fallback.pageSize,
    pageMargin: parsed.pageMargin || fallback.pageMargin,
  };
}
