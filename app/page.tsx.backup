"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type HubState = any;
type CalendarEvent = { title: string; start: string; end?: string; location?: string };
type Submission = { id: string; title: string; course: string; type: string; fileUrl: string; createdAt: string };

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function HomePage() {
  const [state, setState] = useState<HubState | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [type, setType] = useState("notes");
  const [fileUrl, setFileUrl] = useState("");
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  async function loadAll() {
    const [s, c, p] = await Promise.all([
      fetch("/.netlify/functions/status-get").then((r) => r.json()),
      fetch("/.netlify/functions/calendar-get").then((r) => r.json()),
      fetch("/.netlify/functions/submissions-public").then((r) => r.json()),
    ]);
    if (s?.ok) setState(s.state);
    if (c?.ok) setEvents(c.events || []);
    if (p?.ok) setSubmissions(p.submissions || []);
  }

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 60_000);
    return () => clearInterval(t);
  }, []);

  const monitorCards = useMemo(() => {
    if (!state) return [];
    const results = state.monitorResults || {};
    const monitors = state.monitors || [];
    return monitors.map((m: any) => {
      const r = results[m.id];
      const ok = r?.ok === true;
      const checkedAt = r?.checkedAt;
      return { id: m.id, name: m.name, url: m.url, ok, checkedAt, httpStatus: r?.httpStatus };
    });
  }, [state]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return events
      .filter((e) => {
        const eventDate = new Date(e.start);
        return eventDate >= now && eventDate <= sevenDaysFromNow;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 7);
  }, [events]);

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery) return submissions;
    const query = searchQuery.toLowerCase();
    return submissions.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.course.toLowerCase().includes(query) ||
        s.type.toLowerCase().includes(query)
    );
  }, [submissions, searchQuery]);

  async function submit() {
    setSubmitMsg(null);
    const payload = { title, course, type, fileUrl };
    const res = await fetch("/.netlify/functions/submissions-create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data?.ok) {
      setSubmitMsg(data?.error || "Submission failed.");
      return;
    }
    setSubmitMsg("✅ Submitted! It will appear after admin approval.");
    setTitle("");
    setCourse("");
    setType("notes");
    setFileUrl("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Queens College Hub</h1>
            <p className="text-sm text-gray-600">Your campus information center</p>
          </div>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Home
            </Link>
            <Link href="#status" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Status
            </Link>
            <Link href="#calendar" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Calendar
            </Link>
            <Link href="#library" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Library
            </Link>
            <Link href="/admin" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section id="status">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campus Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(state?.manual || []).map((x: any) => (
              <div key={x.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-3 w-3 rounded-full ${x.severity === 'ok' ? 'bg-green-500' : x.severity === 'warn' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                  <h3 className="font-semibold text-gray-900">{x.title}</h3>
                </div>
                <p className="text-gray-600 text-sm">{x.message}</p>
                <p className="text-xs text-gray-400 mt-2">Updated {fmt(x.updatedAt)}</p>
              </div>
            ))}
            {monitorCards.map((m: any) => (
              <div key={m.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-3 w-3 rounded-full ${m.ok ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <h3 className="font-semibold text-gray-900">{m.name}</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {m.ok ? "✓ Operational" : "✗ Down"} {typeof m.httpStatus === "number" ? `(${m.httpStatus})` : ""}
                </p>
                <p className="text-xs text-gray-400 mt-2">Checked {m.checkedAt ? fmt(m.checkedAt) : "not yet"}</p>
                <a href={m.url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline mt-1 inline-block">
                  Visit site →
                </a>
              </div>
            ))}
          </div>
        </section>

        <section id="calendar">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Events (Next 7 Days)</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-w-2xl">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500">No upcoming events in the next 7 days.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-2xl font-bold text-blue-600">{new Date(e.start).getDate()}</div>
                      <div className="text-xs text-gray-500 uppercase">{new Date(e.start).toLocaleDateString('en-US', { month: 'short' })}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{e.title}</h3>
                      <p className="text-sm text-gray-600">{new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                      {e.location && <p className="text-xs text-gray-500">📍 {e.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="library">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shared Notes & Exams</h2>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4">Submit Anonymously</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
              />
              <input
                placeholder="Course (ex: ECON 229)"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              >
                <option value="notes">Notes</option>
                <option value="exam">Exam</option>
                <option value="study-guide">Study guide</option>
                <option value="other">Other</option>
              </select>
              <input
                placeholder="File URL (PDF link, Drive link, etc.)"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={submit}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Submit for Review
            </button>
            {submitMsg && <p className="mt-3 text-sm text-gray-700">{submitMsg}</p>}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Approved Library</h3>
              <input
                type="search"
                placeholder="🔍 Search by course, title, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72 placeholder:text-gray-400"
              />
            </div>
            {filteredSubmissions.length === 0 ? (
              <p className="text-gray-500">{searchQuery ? "No results found." : "No approved submissions yet."}</p>
            ) : (
              <div className="space-y-3">
                {filteredSubmissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{s.title}</h4>
                      <p className="text-sm text-gray-600">
                        {s.course} • {s.type} • {fmt(s.createdAt)}
                      </p>
                    </div>
                    <a
                      href={s.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      Open →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>Queens College Hub • Built for students, by students</p>
        </div>
      </footer>
    </div>
  );
}
