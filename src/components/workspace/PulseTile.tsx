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
      className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-line bg-elev px-4 py-4 hover:border-accent"
    >
      <span className="text-xs text-muted">{label}</span>
      <span className="text-2xl font-bold tabular-nums text-ink">{display}</span>
      <span className="text-xs text-muted">{value == null ? "نامشخص" : foot}</span>
    </Link>
  );
}
