import { smsIrConfig } from "./config";
import { toSmsIrMobile } from "./phone";

const SMSIR_VERIFY_URL = "https://api.sms.ir/v1/send/verify";

export class SmsProviderError extends Error {
  constructor(
    public readonly statusCode: number,
    message = "sms_provider_failed",
    public readonly providerStatus?: number
  ) {
    super(message);
    this.name = "SmsProviderError";
  }
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
    const response = await fetch(SMSIR_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-KEY": env.apiKey,
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
      const providerStatus =
        response.status === 401 ? 502 : response.status === 429 ? 429 : 502;
      throw new SmsProviderError(providerStatus, "sms_provider_failed", response.status);
    }

    return {
      messageId:
        payload.data?.messageId === undefined ? undefined : String(payload.data.messageId),
      cost: payload.data?.cost,
    };
  } catch (error) {
    if (error instanceof SmsProviderError) throw error;
    throw new SmsProviderError(502, "sms_provider_failed");
  }
}
