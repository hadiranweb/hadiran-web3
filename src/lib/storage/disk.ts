import { constants as fsConstants } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

/** Liara app env. Set in the console to the exact disk mount path. Never commit a real value. */
export const DISK_ENV = "HADIRAN_DISK";

/** Relative keys on the disk. Bytes live on the mount; Postgres only stores imageKey. */
export const HOME_PORTRAIT_KEY = "home/portrait.svg";
export const AVATAR_BUCKET = "avatars";
export const HOME_BUCKET = "home";

const HOME_EXT = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp"]);
const AVATAR_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export type DiskProbe = {
  configured: boolean;
  readable: boolean;
  writable: boolean;
};

export function diskRoot(): string | null {
  const raw = process.env[DISK_ENV]?.trim();
  if (!raw) return null;
  return path.resolve(raw);
}

export function isDiskConfigured(): boolean {
  return diskRoot() !== null;
}

/** Accept `home/portrait.svg` or `avatars/<file>`. Reject traversal and unknown buckets. */
export function normalizeDiskKey(raw: string): string | null {
  const key = raw.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
  if (!key || key.includes("\0")) return null;
  const parts = key.split("/");
  if (parts.length !== 2) return null;
  const [bucket, filename] = parts;
  if (parts.some((part) => part === "" || part === "." || part === "..")) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(filename)) return null;
  const ext = path.posix.extname(filename).toLowerCase();
  if (bucket === HOME_BUCKET && HOME_EXT.has(ext)) return `${HOME_BUCKET}/${filename}`;
  if (bucket === AVATAR_BUCKET && AVATAR_EXT.has(ext)) return `${AVATAR_BUCKET}/${filename}`;
  return null;
}

export function resolveDiskPath(key: string): string | null {
  const root = diskRoot();
  const safe = normalizeDiskKey(key);
  if (!root || !safe) return null;
  const absolute = path.resolve(root, ...safe.split("/"));
  const relative = path.relative(root, absolute);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return absolute;
}

export function diskMediaUrl(key: string, version?: number): string | null {
  if (!diskRoot()) return null;
  const safe = normalizeDiskKey(key);
  if (!safe) return null;
  const href = `/media/${safe}`;
  return version != null && Number.isFinite(version) ? `${href}?v=${Math.trunc(version)}` : href;
}

export function avatarPhotoUrl(imageKey: string | null, version?: Date | number | null): string | null {
  if (!imageKey) return null;
  const stamp = version instanceof Date ? version.getTime() : version;
  return diskMediaUrl(imageKey, stamp == null ? undefined : stamp);
}

export async function statDiskFile(
  key: string,
): Promise<{ size: number; mtimeMs: number; path: string } | null> {
  const absolute = resolveDiskPath(key);
  if (!absolute) return null;
  try {
    const info = await stat(absolute);
    if (!info.isFile()) return null;
    return { size: info.size, mtimeMs: info.mtimeMs, path: absolute };
  } catch {
    return null;
  }
}

export async function readDiskFile(
  key: string,
): Promise<{ bytes: Uint8Array; mime: string; mtimeMs: number } | null> {
  const info = await statDiskFile(key);
  if (!info) return null;
  const ext = path.posix.extname(key).toLowerCase();
  const mime = MIME[ext];
  if (!mime) return null;
  const bytes = await readFile(info.path);
  return { bytes, mime, mtimeMs: info.mtimeMs };
}

/** Homepage uses this SVG when present; otherwise the built-in reassembly portrait. */
export async function homePortraitPublicUrl(): Promise<string | null> {
  const info = await statDiskFile(HOME_PORTRAIT_KEY);
  if (!info) return null;
  return diskMediaUrl(HOME_PORTRAIT_KEY, Math.trunc(info.mtimeMs));
}

export async function probeDisk(): Promise<DiskProbe> {
  const root = diskRoot();
  if (!root) return { configured: false, readable: false, writable: false };
  let readable = false;
  let writable = false;
  try {
    await access(root, fsConstants.R_OK);
    readable = true;
  } catch {
    readable = false;
  }
  try {
    await access(root, fsConstants.W_OK);
    writable = true;
  } catch {
    writable = false;
  }
  return { configured: true, readable, writable };
}
