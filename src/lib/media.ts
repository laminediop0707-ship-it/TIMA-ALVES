import { prisma } from "@/lib/prisma";
import type { Slide } from "@/lib/content-types";
import { deleteUpload, type SavedUpload } from "@/lib/storage";

/** Media library service (draft side of the CMS). */

export type MediaRecord = {
  id: string;
  type: "IMAGE" | "VIDEO";
  source: "UPLOAD" | "URL";
  url: string;
  title: string;
  caption: string;
  alt: string;
  position: number;
  isCover: boolean;
  inSlideshow: boolean;
  size: number | null;
  mimeType: string;
};

function toRecord(row: {
  id: string;
  type: string;
  source: string;
  url: string | null;
  storageKey: string | null;
  mimeType: string;
  size: number | null;
  title: string;
  caption: string;
  alt: string;
  position: number;
  isCover: boolean;
  inSlideshow: boolean;
}): MediaRecord {
  return {
    id: row.id,
    type: row.type === "VIDEO" ? "VIDEO" : "IMAGE",
    source: row.source === "URL" ? "URL" : "UPLOAD",
    url:
      row.source === "URL"
        ? (row.url ?? "")
        : `/api/media/file/${row.id}`,
    title: row.title,
    caption: row.caption,
    alt: row.alt,
    position: row.position,
    isCover: row.isCover,
    inSlideshow: row.inSlideshow,
    size: row.size,
    mimeType: row.mimeType,
  };
}

export async function listMedia(): Promise<MediaRecord[]> {
  const rows = await prisma.media.findMany({
    where: { deletedAt: null },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toRecord);
}

export async function mediaCount(): Promise<number> {
  return prisma.media.count({ where: { deletedAt: null } });
}

async function nextPosition(): Promise<number> {
  const last = await prisma.media.findFirst({
    where: { deletedAt: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position ?? -1) + 1;
}

export async function createMediaFromUrl(input: {
  type: "IMAGE" | "VIDEO";
  url: string;
  title: string;
  caption: string;
  alt: string;
}): Promise<MediaRecord> {
  const row = await prisma.media.create({
    data: {
      type: input.type,
      source: "URL",
      url: input.url,
      mimeType: input.type === "VIDEO" ? "video/mp4" : "image/jpeg",
      title: input.title,
      caption: input.caption,
      alt: input.alt,
      position: await nextPosition(),
    },
  });
  return toRecord(row);
}

export async function createMediaFromUpload(
  saved: SavedUpload,
  meta: { type: "IMAGE" | "VIDEO"; title: string; caption: string; alt: string },
): Promise<MediaRecord> {
  const row = await prisma.media.create({
    data: {
      type: meta.type,
      source: "UPLOAD",
      storageKey: saved.storageKey,
      mimeType: saved.mimeType,
      size: saved.size,
      title: meta.title,
      caption: meta.caption,
      alt: meta.alt,
      position: await nextPosition(),
    },
  });
  return toRecord(row);
}

export async function updateMedia(
  id: string,
  patch: Partial<{
    title: string;
    caption: string;
    alt: string;
    inSlideshow: boolean;
    isCover: boolean;
  }>,
): Promise<MediaRecord | null> {
  // Only one cover at a time.
  if (patch.isCover === true) {
    await prisma.media.updateMany({
      where: { deletedAt: null, NOT: { id } },
      data: { isCover: false },
    });
  }

  const existing = await prisma.media.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return null;

  const row = await prisma.media.update({ where: { id }, data: patch });
  return toRecord(row);
}

/**
 * Soft-deletes a media row. The file on disk is kept until the next publish
 * so that the currently published slideshow never breaks.
 */
export async function softDeleteMedia(id: string): Promise<boolean> {
  const existing = await prisma.media.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return false;
  await prisma.media.update({
    where: { id },
    data: { deletedAt: new Date(), inSlideshow: false, isCover: false },
  });
  return true;
}

export async function reorderMedia(order: string[]): Promise<void> {
  await prisma.$transaction(
    order.map((id, index) =>
      prisma.media.updateMany({ where: { id }, data: { position: index } }),
    ),
  );
}

/**
 * Builds the ordered slide list that will be frozen into the published
 * content. The chosen cover (if any) is shown first.
 */
export async function buildSlideSnapshot(): Promise<Slide[]> {
  const rows = await prisma.media.findMany({
    where: { deletedAt: null, inSlideshow: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  const ordered = [...rows].sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return a.position - b.position;
  });

  return ordered.map((row) => ({
    id: row.id,
    mediaId: row.id,
    type: row.type === "VIDEO" ? "VIDEO" : "IMAGE",
    url: row.source === "URL" ? (row.url ?? "") : `/api/media/file/${row.id}`,
    title: row.title,
    caption: row.caption,
    alt: row.alt || row.title,
    isCover: row.isCover,
  }));
}

/** Removes files + rows that are deleted and not used by the published site. */
export async function purgeDeletedUploads(publishedMediaIds: string[]): Promise<void> {
  const candidates = await prisma.media.findMany({
    where: { deletedAt: { not: null }, id: { notIn: publishedMediaIds } },
    select: { id: true, storageKey: true },
  });

  for (const row of candidates) {
    if (row.storageKey) await deleteUpload(row.storageKey);
    await prisma.media.delete({ where: { id: row.id } }).catch(() => {});
  }
}

/** Used when a published media file must be served. */
export async function getMediaStorageKey(id: string): Promise<string | null> {
  const row = await prisma.media.findUnique({
    where: { id },
    select: { storageKey: true, source: true },
  });
  if (!row || row.source !== "UPLOAD") return null;
  return row.storageKey;
}
