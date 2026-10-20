import { hasDatabaseUrl } from "@/db";

/** live=خوانده شد (صفر هم خالی واقعی است). unavailable=بدون اتصال. error=شکست خواندن. */
export type PublicSource = "live" | "unavailable" | "error";

export type PublicCount = {
  source: PublicSource;
  value: number | null;
};

export type PublicCollection<T> = {
  source: PublicSource;
  items: T[];
};

function logPublicRead(scope: string, error: unknown) {
  console.error(`[hadiran] ${scope}`, error instanceof Error ? error.name : "unknown");
}

export async function readPublic<T>(
  scope: string,
  load: () => Promise<T>,
): Promise<{ source: PublicSource; data: T | null }> {
  if (!hasDatabaseUrl()) return { source: "unavailable", data: null };
  try {
    return { source: "live", data: await load() };
  } catch (error) {
    logPublicRead(scope, error);
    return { source: "error", data: null };
  }
}

export async function readPublicCount(scope: string, load: () => Promise<number>): Promise<PublicCount> {
  const result = await readPublic(scope, load);
  if (result.source !== "live" || result.data == null) {
    return { source: result.source === "unavailable" ? "unavailable" : "error", value: null };
  }
  return { source: "live", value: result.data };
}

export async function readPublicCollection<T>(scope: string, load: () => Promise<T[]>): Promise<PublicCollection<T>> {
  const result = await readPublic(scope, load);
  if (result.source !== "live" || !result.data) {
    return { source: result.source === "unavailable" ? "unavailable" : "error", items: [] };
  }
  return { source: "live", items: result.data };
}

export function publicCountLabel(count: PublicCount, unit: string): string {
  if (count.source === "live" && count.value != null) {
    return `${count.value.toLocaleString("fa-IR")} ${unit}`;
  }
  if (count.source === "unavailable") return "منبع در دسترس نیست";
  return "شمار خوانده نشد";
}
