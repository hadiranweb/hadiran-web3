import Link from "next/link";

export function PulseTile({
  href,
  label,
  value,
  foot,
}: {
  href: string;
  label: string;
  value: number | null;
  foot: string;
}) {
  const display = value == null ? "—" : value.toLocaleString("fa-IR");
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 hover:border-indigo-200"
    >
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-2xl font-bold tabular-nums text-slate-900">{display}</span>
      <span className="text-xs text-slate-500">{value == null ? "نامشخص" : foot}</span>
    </Link>
  );
}
