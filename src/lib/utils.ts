export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(price: number, currency = "IRR"): string {
  if (currency === "IRR") {
    return `${price.toLocaleString("fa-IR")} تومان`;
  }
  return `${price.toLocaleString("fa-IR")} ${currency}`;
}

export function slugifyRoute(
  base: string,
  params: Record<string, string | number | undefined>
): string {
  let path = base;
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      path = path.replace(`:${key}`, String(value));
    }
  }
  return path;
}
