import "server-only";
import path from "node:path";
import { realpath, readFile, stat } from "node:fs/promises";
/** Read-only adapter for future validated uploads. No endpoint currently accepts image uploads. */
export async function readAvatarImage(key: string) {
  if (!/^[a-f0-9-]{16,100}\.(png|jpg|jpeg|webp|avif)$/.test(key)) return null;
  const configured = process.env.HADIRAN_MEDIA_ROOT;
  if (!configured || !path.isAbsolute(configured)) return null;
  try {
    const root = await realpath(path.join(configured, "avatars"));
    const file = await realpath(path.join(root, key));
    if (!file.startsWith(root + path.sep)) return null;
    const metadata = await stat(file);
    if (!metadata.isFile() || metadata.size > 5 * 1024 * 1024) return null;
    const type: Record<string,string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", avif: "image/avif" };
    return { data: new Uint8Array(await readFile(file)), type: type[path.extname(file).slice(1)] };
  } catch { return null; }
}
