// Telegram proxy for Cloudflare Workers (module format).
// Outbound: /bot<token>/<method> → api.telegram.org
// Inbound:  /hook/<botId> → https://hadiranweb.ir/api/bots/telegram/<botId>/webhook
// botId is the Hadiran row id (hex), never the BotFather token.
// Keep this Worker on workers.dev — do not route hadiranweb.ir/* here (loop).
// Do not put this Worker's hostname in git.
const DEFAULT_HADIRAN_ORIGIN = "https://hadiranweb.ir";
const TELEGRAM_ORIGIN = "https://api.telegram.org";
const MAX_WEBHOOK_BYTES = 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function hadiranOrigin(env) {
  const raw = String((env && env.HADIRAN_ORIGIN) || DEFAULT_HADIRAN_ORIGIN).trim();
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return DEFAULT_HADIRAN_ORIGIN;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}` || DEFAULT_HADIRAN_ORIGIN;
  } catch {
    return DEFAULT_HADIRAN_ORIGIN;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "hadiran-telegram-proxy" });
    }

    if (url.pathname.startsWith("/bot")) {
      const validBotApiPath = /^\/bot[0-9]+:[A-Za-z0-9_-]+\/[A-Za-z][A-Za-z0-9_]*$/.test(url.pathname);
      if (!validBotApiPath) {
        return json({ ok: false, error: "invalid_telegram_path" }, 404);
      }
      const upstream = new URL(url.pathname + url.search, TELEGRAM_ORIGIN);
      const headers = new Headers();
      const contentType = request.headers.get("content-type");
      if (contentType) headers.set("Content-Type", contentType);
      headers.set("Accept", "application/json");
      const init = {
        method: request.method,
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
      };
      if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = await request.arrayBuffer();
      }
      try {
        return await fetch(upstream, init);
      } catch {
        return json({ ok: false, error: "telegram_unreachable" }, 502);
      }
    }

    const hook = /^\/hook\/([A-Za-z0-9_-]{1,64})$/.exec(url.pathname);
    if (hook) {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
      }
      const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (!secret) {
        return json({ ok: false, error: "missing_webhook_secret" }, 401);
      }
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
        return json({ ok: false, error: "payload_too_large" }, 413);
      }
      const dest = `${hadiranOrigin(env)}/api/bots/telegram/${encodeURIComponent(hook[1])}/webhook`;
      const headers = new Headers({
        "Content-Type": request.headers.get("content-type") || "application/json",
        "X-Telegram-Bot-Api-Secret-Token": secret,
        Accept: "application/json",
      });
      try {
        const originRes = await fetch(dest, {
          method: "POST",
          headers,
          body: await request.arrayBuffer(),
          redirect: "manual",
          signal: AbortSignal.timeout(15000),
        });
        return new Response(originRes.body, {
          status: originRes.status,
          headers: {
            "Content-Type": originRes.headers.get("content-type") || "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      } catch {
        return json({ ok: false, error: "origin_unreachable" }, 502);
      }
    }

    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  },
};
