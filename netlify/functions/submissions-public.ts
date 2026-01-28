// netlify/functions/submissions-public.ts
import { getJSON } from "./_store";
import { json } from "./_http";
import type { Submission } from "./_types";

const KEY = "submissions";

export default async function handler(req: Request) {
  if (req.method !== "GET") return json({ ok: false }, { status: 405 });

  const submissions = await getJSON<Submission[]>(KEY, []);
  const approved = submissions.filter((s) => s.status === "approved");

  return json({ ok: true, submissions: approved });
}
