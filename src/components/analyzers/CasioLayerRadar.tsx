import { faNum, faScore } from "@/lib/analyzers/document-model";

export type CasioRadarPoint = {
  id: string;
  labelFa: string;
  value: number | null;
  max: number;
  bottleneck?: boolean;
};

/** نمودار چندوجهی خالص SVG — بدون canvas و بدون وابستگی نمودار. چاپ‌پذیر. */
export function CasioLayerRadar({
  points,
  size = 320,
  caption = "نمای پنج‌لایه",
}: {
  points: CasioRadarPoint[];
  size?: number;
  caption?: string;
}) {
  const n = points.length;
  if (n < 3) return null;

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
  const dataPoly = dataPoints.map((pair) => pair.join(",")).join(" ");

  return (
    <figure className="casio-radar">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={caption}
      >
        {Array.from({ length: rings }, (_, ring) => {
          const t = (ring + 1) / rings;
          return (
            <polygon
              key={t}
              points={polygon(t)}
              fill={ring === rings - 1 ? "rgba(21,96,130,0.04)" : "none"}
              stroke="#C9D3DA"
              strokeWidth={0.8}
            />
          );
        })}
        {points.map((point, index) => {
          const [x, y] = vertex(index, 1);
          return <line key={point.id} x1={cx} y1={cy} x2={x} y2={y} stroke="#C9D3DA" strokeWidth={0.8} />;
        })}
        <polygon points={dataPoly} fill="rgba(21,96,130,0.28)" stroke="#156082" strokeWidth={1.6} />
        {points.map((point, index) => {
          const [x, y] = dataPoints[index] ?? [cx, cy];
          return (
            <circle
              key={`${point.id}-dot`}
              cx={x}
              cy={y}
              r={point.bottleneck ? 4.2 : 3.2}
              fill={point.bottleneck ? "#7F0000" : "#0E2841"}
            />
          );
        })}
        {points.map((point, index) => {
          const [x, y] = vertex(index, 1.28);
          const anchor = x < cx - 6 ? "end" : x > cx + 6 ? "start" : "middle";
          const baseline = y > cy + 8 ? "hanging" : y < cy - 8 ? "auto" : "middle";
          return (
            <text
              key={`${point.id}-label`}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline={baseline}
              fill={point.bottleneck ? "#7F0000" : "#0E2841"}
              fontSize={11}
              fontWeight={600}
            >
              {point.labelFa}
            </text>
          );
        })}
      </svg>
      <figcaption>
        {caption}
        {points.some((point) => point.bottleneck) ? (
          <span> · رأس سرخ = گلوگاه</span>
        ) : null}
        <span className="casio-radar-scale"> مقیاس {faNum(0)} تا {faScore(points[0]?.max ?? 20)}</span>
      </figcaption>
    </figure>
  );
}
