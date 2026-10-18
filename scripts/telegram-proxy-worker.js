// Telegram Bot API proxy for Cloudflare Workers (free plan).
// Liara in Iran cannot reach api.telegram.org. This Worker can.
// Deploy: docs/telegram-proxy.md
// Inbound Telegram webhooks stay on https://hadiranweb.ir — do not route them here.
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/bot")) {
      return new Response("Not found", { status: 404 });
    }
    const upstream = new URL(url.pathname + url.search, "https://api.telegram.org");
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    const init = { method: request.method, headers };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }
    return fetch(upstream, init);
  },
};
