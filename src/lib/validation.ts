import { z } from "zod";

/** Zod validation shared by the API routes. */

const text = z.string().max(8000);
const longText = z.string().max(20000);
const emoji = z.string().min(1).max(12);

export const poemSchema = z.object({
  id: z.string().min(1).max(120),
  kicker: text,
  title: text,
  text: longText,
  continueLabel: text,
});

export const contentSchema = z.object({
  meta: z.object({
    documentTitle: text,
    brandName: text,
    shortName: text,
    badge: text,
    footerSignature: text,
  }),
  landing: z.object({
    badge: text,
    heading: text,
    subheading: longText,
    ctaPrimary: text,
    ctaSecondary: text,
    note: longText,
  }),
  gate: z.object({
    badge: text,
    heading: text,
    message: longText,
    label: text,
    placeholder: text,
    button: text,
    errorMessage: text,
    hint: text,
  }),
  intro: z.object({
    badge: text,
    heading: text,
    message: longText,
    startButton: text,
  }),
  poems: z.array(poemSchema).max(100),
  slideshow: z.object({
    kicker: text,
    heading: text,
    intro: longText,
    emptyMessage: longText,
    prevLabel: text,
    nextLabel: text,
    continueLabel: text,
    autoplayOn: text,
    autoplayOff: text,
    counterTemplate: text,
    loadingLabel: text,
    errorLabel: text,
  }),
  final: z.object({
    kicker: text,
    heading: text,
    message: longText,
    signature: text,
    heartButton: text,
    replayLabel: text,
    finaleMessage: longText,
  }),
  decorations: z.object({
    emojis: z.array(emoji).max(40),
  }),
});

export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

export const unlockSchema = z.object({
  name: z.string().min(1).max(200),
});

export const mediaUrlSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO"]),
  url: z
    .string()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), "URL must be http(s)"),
  title: z.string().max(200).default(""),
  caption: z.string().max(600).default(""),
  alt: z.string().max(300).default(""),
});

export const mediaUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  caption: z.string().max(600).optional(),
  alt: z.string().max(300).optional(),
  inSlideshow: z.boolean().optional(),
  isCover: z.boolean().optional(),
});

export const reorderSchema = z.object({
  order: z.array(z.string().min(1)).max(500),
});
