import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Uploaded media lives OUTSIDE /public in STORAGE_DIR and is streamed by
 * /api/media/file/[id], which sets the content type explicitly and disables
 * sniffing. This prevents uploaded files from ever being executed by the
 * browser or by the web server.
 */

export const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const ALLOWED_VIDEO_MIME = ["video/mp4", "video/webm"] as const;

export const ALLOWED_MIME = [
  ...ALLOWED_IMAGE_MIME,
  ...ALLOWED_VIDEO_MIME,
] as const;

export type AllowedMime = (typeof ALLOWED_MIME)[number];

const EXT_BY_MIME: Record<AllowedMime, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

export function isImage(mime: string): boolean {
  return (ALLOWED_IMAGE_MIME as readonly string[]).includes(mime);
}

export function isVideo(mime: string): boolean {
  return (ALLOWED_VIDEO_MIME as readonly string[]).includes(mime);
}

export function storageRoot(): string {
  return path.resolve(process.env.STORAGE_DIR ?? "./storage/uploads");
}

export async function ensureStorageDir(): Promise<string> {
  const dir = storageRoot();
  await mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Detects the real file kind from its magic bytes, so a renamed .exe cannot
 * pass as an image. Returns the matching MIME type or null.
 */
export function detectMimeFromBytes(buffer: Buffer): AllowedMime | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  // GIF
  const gif = buffer.toString("ascii", 0, 6);
  if (gif === "GIF87a" || gif === "GIF89a") {
    return "image/gif";
  }
  // ISO-BMFF (avif / mp4): "ftyp" at offset 4
  if (buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12).toLowerCase();
    if (["avif", "avis", "mif1", "msf1"].includes(brand)) return "image/avif";
    // Common MP4 brands.
    if (
      ["isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "dash", "mmp4", "M4V ", "M4A "].includes(
        brand,
      )
    ) {
      return "video/mp4";
    }
    return "video/mp4";
  }
  // EBML (webm/mkv)
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "video/webm";
  }

  return null;
}

export type SavedUpload = {
  storageKey: string;
  size: number;
  mimeType: AllowedMime;
};

export async function saveUpload(buffer: Buffer): Promise<SavedUpload> {
  const detected = detectMimeFromBytes(buffer);
  if (!detected) {
    throw new UploadError(
      "Format non reconnu. Utilise une image (JPG, PNG, WebP, GIF, AVIF) ou une vidéo (MP4, WebM).",
    );
  }

  const dir = await ensureStorageDir();
  const storageKey = `${randomUUID()}${EXT_BY_MIME[detected]}`;
  await writeFile(path.join(dir, storageKey), buffer);
  return { storageKey, size: buffer.length, mimeType: detected };
}

export async function deleteUpload(storageKey: string): Promise<void> {
  if (!storageKey || storageKey.includes("..") || storageKey.includes("/") || storageKey.includes("\\")) {
    return;
  }
  await unlink(path.join(storageRoot(), storageKey)).catch(() => {});
}

export async function readUpload(
  storageKey: string,
): Promise<{ buffer: Buffer; mimeType: AllowedMime | null } | null> {
  if (!storageKey || storageKey.includes("..") || storageKey.includes("/") || storageKey.includes("\\")) {
    return null;
  }
  try {
    const buffer = await readFile(path.join(storageRoot(), storageKey));
    return { buffer, mimeType: detectMimeFromBytes(buffer) };
  } catch {
    return null;
  }
}

export class UploadError extends Error {}
