// netlify/functions/uptime-check.ts
import { getJSON, setJSON } from "./_store";
import { json } from "./_http";
import type { HubState, MonitorResult } from "./_types";

const STATE_KEY = "hub-state";

// Lightweight anti-spam: skip if run too recently (60 seconds)
const MIN_INTERVAL_MS = 60_000;

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false as const, status: undefined as unknown as number };
  } finally {
    clearTimeout(t);
  }
}

export default async function handler(req: Request) {
  const state = await getJSON<HubState>(STATE_KEY, {
    manual: [],
    monitors: [],
    monitorResults: {},
  });

  const now = Date.now();
  if (state.lastAutoRun) {
    const prev = Date.parse(state.lastAutoRun);
    if (!Number.isNaN(prev) && now - prev < MIN_INTERVAL_MS) {
      return json({ ok: true, skipped: true, reason: "Ran too recently" });
    }
  }

  const checkedAt = new Date().toISOString();
  const results: Record<string, MonitorResult> = { ...state.monitorResults };

  for (const m of state.monitors) {
    const r = await fetchWithTimeout(m.url, 8000);
    results[m.id] = {
      monitorId: m.id,
      ok: r.ok,
      httpStatus: r.status,
      checkedAt,
    };
  }

  const updated: HubState = {
    ...state,
    monitorResults: results,
    lastAutoRun: checkedAt,
  };

  await setJSON(STATE_KEY, updated);

  return json({ ok: true, checkedAt, monitors: state.monitors.length });
}
