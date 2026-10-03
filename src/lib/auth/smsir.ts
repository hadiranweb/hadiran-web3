import { smsIrConfig } from "./config";
import { toSmsIrMobile } from "./phone";

export class SmsProviderError extends Error {
  constructor(
    public readonly statusCode: number,
    message = "sms_provider_failed",
    public readonly providerStatus?: number,
  ) {
    super(message);
    this.name = "SmsProviderError";
  }
}

function verifyUrl() {
  const base = (process.env.SMSIR_API_BASE || "https://api.sms.ir").replace(/\/+$/, "");
  return `${base}/v1/send/verify`;
}

export async function sendSmsIrVerificationCode(input: {
  phone: string;
  code: string;
}): Promise<{ messageId?: string; cost?: number }> {
  const env = smsIrConfig();
  if (!env.configured) {
    throw new SmsProviderError(503, "sms_provider_not_configured");
  }

  const mobile = toSmsIrMobile(input.phone);
  try {
    const response = await fetch(verifyUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain",
        "x-api-key": env.apiKey,
      },
      body: JSON.stringify({
        mobile,
        templateId: env.templateId,
        parameters: [{ name: env.codeParameter, value: input.code }],
      }),
      signal: AbortSignal.timeout(env.timeoutMs),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      status?: number;
      message?: string;
      data?: { messageId?: number; cost?: number };
    };

    if (!response.ok || payload.status !== 1) {
      console.error("[hadiran-otp] sms.ir rejected", {
        http: response.status,
        status: payload.status ?? null,
      });
      if (response.status === 401 || response.status === 403) {
        throw new SmsProviderError(502, "sms_provider_auth", response.status);
      }
      if (response.status === 429) {
        throw new SmsProviderError(429, "rate_limit_exceeded", response.status);
      }
      throw new SmsProviderError(502, "sms_provider_rejected", response.status);
    }

    return {
      messageId: payload.data?.messageId === undefined ? undefined : String(payload.data.messageId),
      cost: payload.data?.cost,
    };
  } catch (error) {
    if (error instanceof SmsProviderError) throw error;
    const name = error instanceof Error ? error.name : "";
    console.error("[hadiran-otp] sms.ir transport", name || "unknown");
    if (name === "TimeoutError" || name === "AbortError") {
      throw new SmsProviderError(504, "sms_provider_timeout");
    }
    throw new SmsProviderError(502, "sms_provider_unreachable");
  }
}
