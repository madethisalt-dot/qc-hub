// netlify/functions/submissions-create.ts
import { getJSON, setJSON } from "./_store";
import { json, badRequest } from "./_http";
import type { Submission } from "./_types";

const KEY = "submissions";

function newId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ ok: false }, { status: 405 });

  const body = await req.json().catch(() => null) as Partial<Submission> | null;

  if (!body) return badRequest("Invalid JSON body.");

  const title = (body.title || "").trim();
  const course = (body.course || "").trim();
  const type = body.type;
  const fileUrl = (body.fileUrl || "").trim();

  if (!title || !course || !type || !fileUrl) {
    return badRequest("Required: title, course, type, fileUrl");
  }

  const submissions = await getJSON<Submission[]>(KEY, []);
  const createdAt = new Date().toISOString();

  const submission: Submission = {
    id: newId(),
    title,
    course,
    type: type as any,
    fileUrl,
    status: "pending",
    createdAt,
  };

  await setJSON(KEY, [submission, ...submissions]);

  return json({ ok: true, submission });
}
