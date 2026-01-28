// netlify/functions/status-get.ts
import { getJSON, setJSON } from "./_store";
import { json } from "./_http";
import type { HubState } from "./_types";

const STATE_KEY = "hub-state";

function defaultState(): HubState {
  return {
    manual: [],
    monitors: [
      {
        id: "qc-ical",
        name: "Queens College Calendar Feed",
        url: "https://www.calendarwiz.com/CalendarWiz_iCal.php?crd=queenscollege",
      },
      {
        id: "cunyfirst",
        name: "CUNYfirst Page",
        url: "https://www.cuny.edu/about/administration/offices/cis/cunyfirst/",
      },
    ],
    monitorResults: {},
  };
}

export default async function handler(req: Request) {
  if (req.method !== "GET") return json({ ok: false }, { status: 405 });

  // Initialize state once
  const state = await getJSON<HubState>(STATE_KEY, defaultState());
  await setJSON(STATE_KEY, state);

  return json({ ok: true, state });
}
