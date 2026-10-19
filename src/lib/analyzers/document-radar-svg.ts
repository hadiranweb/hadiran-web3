import { faNum, faScore } from "@/lib/analyzers/document-model";

export type RadarPoint = {
  id: string;
  labelFa: string;
  value: number | null;
  max: number;
  bottleneck?: boolean;
};

export function radarSvgHtml(points: RadarPoint[], size = 320, caption = "نمای پنج‌لایه"): string {
  const n = points.length;
  if (n < 3) return "";
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.32;
  const rings = 4;

  function vertex(index: number, t: number): [number, number] {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / n;
    return [cx + Math.cos(angle) * radius * t, cy + Math.sin(angle) * radius * t];
  }

  function polygon(t: number) {
    return Array.from({ length: n }, (_, i) => vertex(i, t).join(",")).join(" ");
  }

  const dataPoints = points.map((point, index) => {
    const max = point.max > 0 ? point.max : 20;
    const t = point.value == null ? 0 : Math.max(0, Math.min(1, point.value / max));
    return vertex(index, t);
  });

  const ringMarkup = Array.from({ length: rings }, (_, ring) => {
    const t = (ring + 1) / rings;
    const fill = ring === rings - 1 ? "rgba(21,96,130,0.04)" : "none";
    return `<polygon points="${polygon(t)}" fill="${fill}" stroke="#C9D3DA" stroke-width="0.8"/>`;
  }).join("");

  const axes = points
    .map((point, index) => {
      const [x, y] = vertex(index, 1);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#C9D3DA" stroke-width="0.8"/>`;
    })
    .join("");

  const dataPoly = dataPoints.map((pair) => pair.join(",")).join(" ");
  const dots = points
    .map((point, index) => {
      const [x, y] = dataPoints[index] ?? [cx, cy];
      const r = point.bottleneck ? 4.2 : 3.2;
      const fill = point.bottleneck ? "#7F0000" : "#0E2841";
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
    })
    .join("");

  const labels = points
    .map((point, index) => {
      const [x, y] = vertex(index, 1.28);
      const anchor = x < cx - 6 ? "end" : x > cx + 6 ? "start" : "middle";
      const baseline = y > cy + 8 ? "hanging" : y < cy - 8 ? "auto" : "middle";
      const fill = point.bottleneck ? "#7F0000" : "#0E2841";
      const text = point.labelFa.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="${baseline}" fill="${fill}" font-size="11" font-weight="600">${text}</text>`;
    })
    .join("");

  const bottleneckNote = points.some((point) => point.bottleneck) ? " · رأس سرخ = گلوگاه" : "";
  const scale = `مقیاس ${faNum(0)} تا ${faScore(points[0]?.max ?? 20)}`;

  return `<figure class="casio-radar doc-radar">
  <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${caption}">
    ${ringMarkup}${axes}<polygon points="${dataPoly}" fill="rgba(21,96,130,0.28)" stroke="#156082" stroke-width="1.6"/>${dots}${labels}
  </svg>
  <figcaption>${caption}${bottleneckNote}<span class="casio-radar-scale"> ${scale}</span></figcaption>
</figure>`;
}

const RING_COLORS = ["#a71925", "#176b89", "#c99b53", "#648d79", "#6c7da3"];

/** نمودار حلقه‌ای جلد بستهٔ تحویل کاسیو؛ نسبت نمرهٔ هر لایه روی یک حلقه. */
export function overallChartSvg(points: RadarPoint[]): string {
  if (!points.length) return "";
  const cx = 180;
  const cy = 180;
  const outer = 143;
  const inner = 55;
  const n = points.length;
  const step = n > 1 ? (outer - inner) / (n - 1) : 0;
  const rings = points
    .map((point, index) => {
      const r = outer - step * index;
      const max = point.max > 0 ? point.max : 20;
      const t = point.value == null ? 0 : Math.max(0, Math.min(1, point.value / max));
      const c = 2 * Math.PI * r;
      const dash = t * c;
      const color = RING_COLORS[index % RING_COLORS.length]!;
      return [
        `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(2)}" fill="none" stroke="#ffffff22" stroke-width="12"/>`,
        `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(2)}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${dash.toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`,
      ].join("");
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360" role="img" aria-label="نمای کلی پنج لایه">${rings}</svg>`;
}
