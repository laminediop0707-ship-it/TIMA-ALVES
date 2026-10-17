import { saveDraft } from "@/lib/content";
import { jsonError, jsonOk, requireAdmin, unauthorized } from "@/lib/http";
import { ZodError } from "zod";

export const runtime = "nodejs";

/** Saves the working draft. The published version is left untouched. */
export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  const body = await request.json().catch(() => null);
  try {
    const content = await saveDraft(body);
    return jsonOk({ ok: true, content });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Contenu invalide.", 400, {
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    return jsonError("Impossible d'enregistrer le brouillon.", 500);
  }
}
