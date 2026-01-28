// netlify/functions/status-update.ts
import { getJSON, setJSON } from "./_store";
import { json, badRequest, requireAdmin, unauthorized } from "./_http";
import type { HubState, ManualStatusItem, Monitor } from "./_types";

const STATE_KEY = "hub-state";

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ ok: false }, { status: 405 });
  if (!requireAdmin(req)) return unauthorized();

  const body = await req.json().catch(() => null) as
    | { manual?: ManualStatusItem[]; monitors?: Monitor[] }
    | null;

  if (!body) return badRequest("Invalid JSON body.");

  const state = await getJSON<HubState>(STATE_KEY, {
    manual: [],
    monitors: [],
    monitorResults: {},
  });

  const updated: HubState = {
    ...state,
    manual: body.manual ?? state.manual,
    monitors: body.monitors ?? state.monitors,
  };

  await setJSON(STATE_KEY, updated);

  return json({ ok: true, state: updated });
}
