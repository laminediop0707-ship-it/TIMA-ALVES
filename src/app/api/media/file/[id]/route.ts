import { getMediaStorageKey } from "@/lib/media";
import { readUpload } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_FALLBACK = "application/octet-stream";

/**
 * Streams an uploaded file. Media never lives under /public, so nothing is
 * served by the static file handler; this route forces the content type,
 * forbids sniffing and supports HTTP Range (needed to seek in videos).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const storageKey = await getMediaStorageKey(id);
  if (!storageKey) return new Response("Not found", { status: 404 });

  const file = await readUpload(storageKey);
  if (!file) return new Response("Not found", { status: 404 });

  const mime = file.mimeType ?? SAFE_FALLBACK;
  const total = file.buffer.length;

  const baseHeaders: Record<string, string> = {
    "Content-Type": mime,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : total - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
        return new Response("Range not satisfiable", {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }
      const safeEnd = Math.min(end, total - 1);
      const chunk = file.buffer.subarray(start, safeEnd + 1);
      return new Response(new Uint8Array(chunk), {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${safeEnd}/${total}`,
          "Content-Length": String(chunk.length),
        },
      });
    }
  }

  return new Response(new Uint8Array(file.buffer), {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(total) },
  });
}
