export const SHOP_KINDS = ["digital_entitlement", "physical_good", "course_access"] as const;
export type ShopKind = (typeof SHOP_KINDS)[number];

export function isShopKind(value: string): value is ShopKind {
  return (SHOP_KINDS as readonly string[]).includes(value);
}

export function shopKindFa(kind: string): string {
  if (kind === "physical_good") return "کالای فیزیکی";
  if (kind === "course_access") return "دوره / آموزش";
  return "محصول دیجیتال";
}

export function isPhysicalKind(kind: string) {
  return kind === "physical_good";
}
