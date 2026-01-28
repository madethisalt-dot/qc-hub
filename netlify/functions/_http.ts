// netlify/functions/_http.ts
export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function badRequest(message: string) {
  return json({ ok: false, error: message }, { status: 400 });
}

export function unauthorized() {
  return json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export function requireAdmin(req: Request) {
  const token = req.headers.get("x-admin-token") || "";
  const expected = process.env.ADMIN_TOKEN || "";
  return expected.length > 0 && token === expected;
}
