export type BotStatus = "disconnected" | "connected" | "paused" | "error";

export type BotView = {
  id: string;
  titleFa: string;
  channel: "telegram";
  status: BotStatus;
  analyzerSlug: string | null;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  tokenHint: string | null;
  hasToken: boolean;
  webhookUrl: string;
  lastError: string | null;
  lastWebhookAt: string | null;
  lastUpdateKind: string | null;
  lastInboundStatus: number | null;
  telegramLastError: string | null;
  connectedAt: string | null;
  pendingUpdateCount: number | null;
};
