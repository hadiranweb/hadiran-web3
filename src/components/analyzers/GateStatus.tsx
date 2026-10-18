import type { GateView } from "@/lib/analyzers/gate";

const FA = "۰۱۲۳۴۵۶۷۸۹";

function faNum(value: number | string) {
  return String(value).replace(/\d/g, (digit) => FA[Number(digit)] ?? digit);
}

function faScore(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return faNum(Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1));
}

const tone: Record<GateView["bandId"], string> = {
  green: "bg-emerald-100 text-emerald-900",
  yellow: "bg-amber-100 text-amber-950",
  red: "bg-rose-100 text-rose-900",
};

export function GateChip({ gate }: { gate: GateView }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone[gate.bandId]}`}>
      ارزیابی {gate.labelFa}
    </span>
  );
}

export function GateStatus({ gate }: { gate: GateView }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">نتیجهٔ ارزیابی (بخش اول)</p>
        <GateChip gate={gate} />
      </div>
      {gate.total != null ? (
        <p className="text-sm text-slate-600">
          نمرهٔ ارزیابی {faScore(gate.total)} از {faNum(100)}
        </p>
      ) : null}
      {gate.dimensions.length ? (
        <ul className="space-y-1 text-sm text-slate-600">
          {gate.dimensions.map((row) => (
            <li key={row.id}>
              {row.titleFa}: {faScore(row.score)} از {faNum(10)}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs leading-6 text-slate-500">عضو این سه رنگ را نمی‌بیند.</p>
    </div>
  );
}
