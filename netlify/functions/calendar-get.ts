// netlify/functions/calendar-get.ts
import { getJSON, setJSON } from "./_store";
import { json } from "./_http";
import ical from "ical";

type CalendarEvent = {
  title: string;
  start: string;
  end?: string;
  location?: string;
};

const CACHE_KEY = "calendar-cache";
const CACHE_TTL_MS = 15 * 60_000;

export default async function handler(req: Request) {
  if (req.method !== "GET") return json({ ok: false }, { status: 405 });

  const icalUrl = process.env.ICAL_URL || "";
  if (!icalUrl) return json({ ok: false, error: "Missing ICAL_URL" }, { status: 500 });

  const cached = await getJSON<{ fetchedAt: string; events: CalendarEvent[] } | null>(CACHE_KEY, null);

  if (cached) {
    const age = Date.now() - Date.parse(cached.fetchedAt);
    if (!Number.isNaN(age) && age < CACHE_TTL_MS) {
      return json({ ok: true, source: "cache", events: cached.events });
    }
  }

  const res = await fetch(icalUrl, { redirect: "follow" });
  if (!res.ok) return json({ ok: false, error: `iCal fetch failed: ${res.status}` }, { status: 502 });

  const text = await res.text();
  const data = ical.parseICS(text);

  // Get current date at midnight and 7 days from now
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  sevenDaysFromNow.setHours(23, 59, 59, 999);

  const events: CalendarEvent[] = Object.values(data)
    .filter((x: any) => {
      if (x?.type !== "VEVENT" || !x?.start) return false;
      const eventDate = new Date(x.start);
      // Only include events from today onwards and within next 7 days
      return eventDate >= now && eventDate <= sevenDaysFromNow;
    })
    .map((x: any) => ({
      title: String(x.summary ?? "Event"),
      start: new Date(x.start).toISOString(),
      end: x.end ? new Date(x.end).toISOString() : undefined,
      location: x.location ? String(x.location) : undefined,
    }))
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .slice(0, 30);

  const payload = { fetchedAt: new Date().toISOString(), events };
  await setJSON(CACHE_KEY, payload);

  return json({ ok: true, source: "live", events });
}
