import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { developmentTestLogin } from "./config";

export const PREVIEW_TICKET_PARAM = "preview_access";
export const PREVIEW_TICKET_HEADER = "x-hadiran-preview-ticket";
const TTL = 60 * 60;
type Payload = { aud: "workspace-preview"; exp: number; nonce: string };
type TicketState = { secret: Buffer; revoked: Map<string, number> };
const globalState = globalThis as typeof globalThis & { __hadiranPreviewTickets?: TicketState };
function enabled() { return !process.env.DATABASE_URL && !!developmentTestLogin(); }
function state() {
  if (!globalState.__hadiranPreviewTickets) globalState.__hadiranPreviewTickets = { secret: randomBytes(32), revoked: new Map() };
  return globalState.__hadiranPreviewTickets;
}
function prune() {
  const now = Math.floor(Date.now() / 1000);
  for (const [nonce, exp] of state().revoked) if (exp <= now) state().revoked.delete(nonce);
}
export function issuePreviewTicket(): string | null {
  if (!enabled()) return null;
  prune();
  const payload: Payload = { aud: "workspace-preview", exp: Math.floor(Date.now() / 1000) + TTL, nonce: randomBytes(16).toString("hex") };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${createHmac("sha256", state().secret).update(body).digest("base64url")}`;
}
function readTicket(ticket: string): Payload | null {
  if (!enabled() || ticket.length > 1024 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(ticket)) return null;
  try {
    const [body, signature] = ticket.split(".");
    const supplied = Buffer.from(signature, "base64url");
    const expected = createHmac("sha256", state().secret).update(body).digest();
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    const now = Math.floor(Date.now() / 1000);
    prune();
    if (data.aud !== "workspace-preview" || !Number.isSafeInteger(data.exp) || data.exp <= now || data.exp > now + TTL || !/^[a-f0-9]{32}$/.test(data.nonce) || state().revoked.has(data.nonce)) return null;
    return data;
  } catch { return null; }
}
export function validPreviewTicket(ticket: string) { return !!readTicket(ticket); }
export function revokePreviewTicket(ticket: string) {
  const data = readTicket(ticket);
  if (data) state().revoked.set(data.nonce, data.exp);
}
