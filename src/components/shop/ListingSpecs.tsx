import type { ShopSpec } from "@/db/schema";

export function ListingSpecs({ specs }: { specs: ShopSpec[] | null | undefined }) {
  if (!specs?.length) return null;
  return (
    <table className="mt-6 w-full overflow-hidden rounded-[var(--radius-md)] border border-line text-sm">
      <tbody>
        {specs.map((row) => (
          <tr key={`${row.key}-${row.value}`} className="border-b border-line last:border-0">
            <th className="w-1/3 bg-paper px-4 py-2 text-right font-medium text-muted">{row.key}</th>
            <td className="px-4 py-2 text-ink">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
