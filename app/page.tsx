// app/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

type HubState = any;
type CalendarEvent = { title: string; start: string; end?: string; location?: string };
type Submission = { id: string; title: string; course: string; type: string; fileUrl: string; createdAt: string };

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function HomePage() {
  const [state, setState] = useState<HubState | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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
    setSubmitMsg("Submitted. It will appear after admin approval.");
    setTitle("");
    setCourse("");
    setType("notes");
    setFileUrl("");
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1>Queens College Hub</h1>
      <p>Community status + calendar + shared notes/exams (anonymous submissions, admin approved).</p>

      <div style={{ marginTop: 24 }}>
        <h2>Status</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {(state?.manual || []).map((x: any) => (
            <div key={x.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{x.title}</div>
              <div style={{ marginTop: 6 }}>{x.message}</div>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                Severity: {x.severity} · Updated: {fmt(x.updatedAt)}
              </div>
            </div>
          ))}
          {monitorCards.map((m) => (
            <div key={m.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{m.name}</div>
              <div style={{ marginTop: 6 }}>
                {m.ok ? "Up" : "Down"} {typeof m.httpStatus === "number" ? `(${m.httpStatus})` : ""}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                Checked: {m.checkedAt ? fmt(m.checkedAt) : "Not yet"}
              </div>
              <a href={m.url} target="_blank" rel="noreferrer">Open</a>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Calendar</h2>
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          {events.length === 0 ? (
            <p>No events loaded.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {events.slice(0, 12).map((e, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{e.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    {fmt(e.start)} {e.location ? `· ${e.location}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Shared Notes and Exams</h2>
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Submit anonymously (pending admin review)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input placeholder="Course (ex: ECON 229)" value={course} onChange={(e) => setCourse(e.target.value)} />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="notes">Notes</option>
              <option value="exam">Exam</option>
              <option value="study-guide">Study guide</option>
              <option value="other">Other</option>
            </select>
            <input placeholder="File URL (PDF link, Drive link, etc.)" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
          </div>
          <button onClick={submit} style={{ marginTop: 10, padding: "8px 12px" }}>
            Submit
          </button>
          {submitMsg ? <p style={{ marginTop: 10 }}>{submitMsg}</p> : null}
        </div>
        <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Approved library</h3>
          {submissions.length === 0 ? (
            <p>No approved submissions yet.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {submissions.map((s) => (
                <li key={s.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700 }}>{s.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    {s.course} · {s.type} · {fmt(s.createdAt)}
                  </div>
                  <a href={s.fileUrl} target="_blank" rel="noreferrer">Open file</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <a href="/admin">Admin panel</a>
      </div>
    </div>
  );
}
