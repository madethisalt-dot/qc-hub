// netlify/functions/submissions-admin-review.ts
import { getJSON, setJSON } from "./_store";
import { json, badRequest, requireAdmin, unauthorized } from "./_http";
import type { Submission } from "./_types";

const KEY = "submissions";

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ ok: false }, { status: 405 });
  if (!requireAdmin(req)) return unauthorized();

  const body = await req.json().catch(() => null) as
    | { id?: string; action?: "approve" | "reject"; note?: string }
    | null;

  if (!body?.id || !body.action) return badRequest("Required: id, action");

  const submissions = await getJSON<Submission[]>(KEY, []);
  const idx = submissions.findIndex((s) => s.id === body.id);

  if (idx < 0) return badRequest("Submission not found.");

  const updated = [...submissions];
  const reviewedAt = new Date().toISOString();

  updated[idx] = {
    ...updated[idx],
    status: body.action === "approve" ? "approved" : "rejected",
    reviewerNote: body.note?.slice(0, 500),
    reviewedAt,
  };

  await setJSON(KEY, updated);

  return json({ ok: true, submission: updated[idx] });
}
