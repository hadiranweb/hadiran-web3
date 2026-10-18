// Telegram proxy for Cloudflare Workers (free plan).
// Outbound: Liara (Iran) cannot reach api.telegram.org — /bot… → Bot API.
// Inbound: Telegram often times out on Iranian origins — /hook/<botId> → hadiran webhook.
// Deploy: docs/telegram-proxy.md
// Do not put this Worker's hostname in git.
const HADIRAN_ORIGIN = "https://hadiranweb.ir";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/bot")) {
      const upstream = new URL(url.pathname + url.search, "https://api.telegram.org");
      const headers = new Headers();
      const contentType = request.headers.get("content-type");
      if (contentType) headers.set("Content-Type", contentType);
      const init = { method: request.method, headers };
      if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = await request.arrayBuffer();
      }
      return fetch(upstream, init);
    }

    const hook = /^\/hook\/([A-Za-z0-9]+)$/.exec(url.pathname);
    if (hook && request.method === "POST") {
      const dest = `${HADIRAN_ORIGIN}/api/bots/telegram/${hook[1]}/webhook`;
      const headers = new Headers();
      const contentType = request.headers.get("content-type");
      if (contentType) headers.set("Content-Type", contentType);
      const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (secret) headers.set("X-Telegram-Bot-Api-Secret-Token", secret);
      let originRes;
      try {
        originRes = await fetch(dest, {
          method: "POST",
          headers,
          body: await request.arrayBuffer(),
        });
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "origin_unreachable" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(originRes.body, {
        status: originRes.status,
        headers: { "Content-Type": originRes.headers.get("Content-Type") || "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
