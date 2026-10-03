import type { ShopSpec } from "@/db/schema";

export function ListingSpecs({ specs }: { specs: ShopSpec[] | null | undefined }) {
  if (!specs?.length) return null;
  return (
    <table className="mt-6 w-full overflow-hidden rounded-2xl border border-slate-200 text-sm">
      <tbody>
        {specs.map((row) => (
          <tr key={`${row.key}-${row.value}`} className="border-b border-slate-100 last:border-0">
            <th className="w-1/3 bg-slate-50 px-4 py-2 text-right font-medium text-slate-600">{row.key}</th>
            <td className="px-4 py-2 text-slate-800">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
