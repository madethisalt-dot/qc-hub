// netlify/functions/submissions-admin-list.ts
import { getJSON } from "./_store";
import { json, requireAdmin, unauthorized } from "./_http";
import type { Submission } from "./_types";

const KEY = "submissions";

export default async function handler(req: Request) {
  if (req.method !== "GET") return json({ ok: false }, { status: 405 });
  if (!requireAdmin(req)) return unauthorized();

  const submissions = await getJSON<Submission[]>(KEY, []);

  return json({ ok: true, submissions });
}
