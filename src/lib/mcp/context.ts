import { desc, eq } from "drizzle-orm";
import { db, hasDatabaseUrl } from "@/db";
import { analyzerReportLayers, analyzerReports, messages } from "@/db/schema";
import type { SessionAccount } from "@/lib/auth/session";
import type { AudienceContext, McpConfig } from "./types";

/**
 * زمینهٔ مخاطب فقط از سشن سرور خوانده می‌شود.
 * شناسهٔ حساب هرگز از body کلاینت گرفته نمی‌شود؛ ورودی این تابع همان SessionAccount سرور است.
 * سطح دسترسی دقیقاً همان است که owner در /workspace/mcp تعیین کرده.
 */
export async function getAudienceContext(input: {
  account: SessionAccount | null;
  conversationId?: number | null;
  config: McpConfig;
}): Promise<AudienceContext> {
  const { account, config } = input;
  const level = config.audienceLevel;
  const base: AudienceContext = {
    level,
    isGuest: !account,
    displayName: null,
    history: [],
    mirror: null,
  };
  if (level === "none") return base;

  // حافظهٔ گفتگو: آخرین نوبت‌های همین مکالمه.
  if (input.conversationId && config.maxHistoryTurns > 0 && hasDatabaseUrl()) {
    try {
      const rows = await db
        .select({ role: messages.role, content: messages.content })
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(config.maxHistoryTurns * 2);
      base.history = rows
        .reverse()
        .map((row) => ({
          role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: row.content,
        }));
    } catch {
      base.history = [];
    }
  }

  if (level === "conversation") return base;

  // هویت پایهٔ عضو: فقط از سشن سرور.
  if (account) {
    base.displayName = account.displayName ?? account.givenName ?? null;
  }
  if (level === "profile") return base;

  // هوشمندی کامل: آخرین گزارش آینهٔ خودِ کاربر + لایهٔ گلوگاه (isBottleneck).
  if (level === "mirror_insights" && account && hasDatabaseUrl()) {
    try {
      const [report] = await db
        .select({
          id: analyzerReports.id,
          coverTitle: analyzerReports.coverTitle,
          maturityLabel: analyzerReports.maturityLabel,
          bottleneckName: analyzerReports.bottleneckName,
          bottleneckScore: analyzerReports.bottleneckScore,
        })
        .from(analyzerReports)
        .where(eq(analyzerReports.accountId, account.id))
        .orderBy(desc(analyzerReports.createdAt))
        .limit(1);
      if (report) {
        const layers = await db
          .select({
            asIsText: analyzerReportLayers.asIsText,
            toBeText: analyzerReportLayers.toBeText,
            isBottleneck: analyzerReportLayers.isBottleneck,
          })
          .from(analyzerReportLayers)
          .where(eq(analyzerReportLayers.reportId, report.id))
          .limit(50);
        const bottleneckLayer = layers.find((l) => l.isBottleneck) ?? layers[0] ?? null;
        base.mirror = {
          coverTitle: report.coverTitle,
          maturityLabel: report.maturityLabel,
          bottleneckName: report.bottleneckName,
          bottleneckScore: report.bottleneckScore,
          layerAsIs: bottleneckLayer?.asIsText ?? null,
          layerToBe: bottleneckLayer?.toBeText ?? null,
        };
      }
    } catch {
      base.mirror = null;
    }
  }

  return base;
}
