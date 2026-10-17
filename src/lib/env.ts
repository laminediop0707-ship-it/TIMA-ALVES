import { z } from "zod";

/**
 * Server-only environment configuration.
 *
 * Never import this from a client component. Secrets referenced here
 * (AUTH_SECRET, ADMIN_BOOTSTRAP_PASSWORD, SURPRISE_NAME) must never reach the
 * browser bundle — they are read at runtime on the server only.
 */

const boolFromString = z
  .string()
  .optional()
  .transform((value) => value === "true" || value === "1");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long"),

  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),
  SURPRISE_TTL_HOURS: z.coerce.number().int().positive().default(24),
  SESSION_COOKIE_SECURE: boolFromString,

  ADMIN_USERNAME: z.string().min(1).default("lemzo"),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(1).optional(),

  SURPRISE_NAME: z.string().min(1).default("Estère Adousinda Alves"),

  STORAGE_DIR: z.string().min(1).default("./storage/uploads"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(25),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;

export const SESSION_COOKIE = "tima_admin_session";
export const SURPRISE_COOKIE = "tima_surprise_session";
export const ADMIN_SESSION_TTL_MS = env.SESSION_TTL_HOURS * 60 * 60 * 1000;
export const SURPRISE_SESSION_TTL_MS = env.SURPRISE_TTL_HOURS * 60 * 60 * 1000;
export const MAX_UPLOAD_BYTES = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
