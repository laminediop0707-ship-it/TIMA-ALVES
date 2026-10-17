import { NextResponse } from "next/server";
import { getAdminSession, type AdminSessionUser } from "@/lib/sessions";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function unauthorized(message = "Non autorisé.") {
  return jsonError(message, 401);
}

export async function requireAdmin(): Promise<AdminSessionUser | null> {
  return getAdminSession();
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "local";
}
