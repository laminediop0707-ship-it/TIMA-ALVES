import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cloneDefaultContent } from "@/lib/content-defaults";
import { contentSchema } from "@/lib/validation";
import type { Content, Slide } from "@/lib/content-types";
import { buildSlideSnapshot, purgeDeletedUploads } from "@/lib/media";

export type PublishedContent = Content & { slides: Slide[] };

export type ContentSnapshot = {
  draft: Content;
  published: PublishedContent;
  publishedAt: string | null;
  updatedAt: string;
};

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** Creates the singleton content row on first use. */
export async function ensureContent() {
  const existing = await prisma.siteContent.findUnique({ where: { id: "main" } });
  if (existing) return existing;

  const defaults = cloneDefaultContent();
  const published: PublishedContent = { ...defaults, slides: [] };

  const created = await prisma.siteContent.create({
    data: {
      id: "main",
      draft: asJson(defaults),
      published: asJson(published),
      publishedAt: new Date(),
    },
  });
  await prisma.contentRevision.create({
    data: { content: asJson(published), label: "Version initiale" },
  });
  return created;
}

export async function getSnapshot(): Promise<ContentSnapshot> {
  const row = await ensureContent();
  return {
    draft: row.draft as unknown as Content,
    published: row.published as unknown as PublishedContent,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getDraft(): Promise<Content> {
  const row = await ensureContent();
  return row.draft as unknown as Content;
}

export async function getPublished(): Promise<PublishedContent> {
  const row = await ensureContent();
  return row.published as unknown as PublishedContent;
}

/** Validates and stores the draft. Published content is untouched. */
export async function saveDraft(input: unknown): Promise<Content> {
  const content = contentSchema.parse(input) as Content;
  await ensureContent();
  await prisma.siteContent.update({
    where: { id: "main" },
    data: { draft: asJson(content) },
  });
  return content;
}

/** Freezes the current draft + media library into the live published version. */
export async function publishDraft(): Promise<PublishedContent> {
  const row = await ensureContent();
  const draft = contentSchema.parse(row.draft) as Content;
  const slides = await buildSlideSnapshot();
  const published: PublishedContent = { ...draft, slides };

  await prisma.$transaction([
    prisma.siteContent.update({
      where: { id: "main" },
      data: {
        published: asJson(published),
        publishedAt: new Date(),
      },
    }),
    prisma.contentRevision.create({
      data: { content: asJson(published), label: "Publication" },
    }),
  ]);

  await purgeDeletedUploads(slides.map((slide) => slide.mediaId));
  return published;
}

/** Reverts the draft back to the currently published content. */
export async function discardDraft(): Promise<Content> {
  const published = await getPublished();
  const { slides: _slides, ...content } = published;
  void _slides;
  const draft = content as Content;
  await prisma.siteContent.update({
    where: { id: "main" },
    data: { draft: asJson(draft) },
  });
  return draft;
}

export async function listRevisions() {
  const rows = await prisma.contentRevision.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, label: true, createdAt: true },
  });
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
  }));
}

/** Loads an old published version back into the draft (text fields only). */
export async function restoreRevision(id: string): Promise<Content | null> {
  const revision = await prisma.contentRevision.findUnique({ where: { id } });
  if (!revision) return null;

  const raw = revision.content as unknown as PublishedContent;
  const { slides: _slides, ...content } = raw;
  void _slides;
  const draft = contentSchema.parse(content) as Content;
  await prisma.siteContent.update({
    where: { id: "main" },
    data: { draft: asJson(draft) },
  });
  return draft;
}
