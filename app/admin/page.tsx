// app/admin/page.tsx
"use client";
import { useEffect, useState } from "react";

type Submission = any;
type HubState = any;

function newId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [state, setState] = useState<HubState | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ADMIN_TOKEN");
    if (saved) setToken(saved);
  }, []);

  function saveToken(t: string) {
    setToken(t);
    localStorage.setItem("ADMIN_TOKEN", t);
  }

  async function load() {
    setMsg(null);
    const s = await fetch("/.netlify/functions/status-get").then((r) => r.json());
    if (s?.ok) setState(s.state);

    const res = await fetch("/.netlify/functions/submissions-admin-list", {
      headers: { "x-admin-token": token },
    });
    const data = await res.json();
    if (!data?.ok) {
      setMsg(data?.error || "Admin list failed. Check token.");
      return;
    }
    setSubmissions(data.submissions || []);
  }

  useEffect(() => {
    if (token) load();
  }, [token]);

  async function review(id: string, action: "approve" | "reject") {
    const res = await fetch("/.netlify/functions/submissions-admin-review", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json();
    if (!data?.ok) {
      setMsg(data?.error || "Review failed.");
      return;
    }
    load();
  }

  async function saveStatus() {
    if (!state) return;
    const res = await fetch("/.netlify/functions/status-update", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ manual: state.manual, monitors: state.monitors }),
    });
    const data = await res.json();
    if (!data?.ok) {
      setMsg(data?.error || "Status save failed.");
      return;
    }
    setMsg("Saved.");
  }

  function addManual() {
    if (!state) return;
    const next = {
      ...state,
      manual: [
        {
          id: newId(),
          title: "New status item",
          message: "",
          severity: "info",
          updatedAt: new Date().toISOString(),
        },
        ...(state.manual || []),
      ],
    };
    setState(next);
  }

  function updateManual(i: number, patch: any) {
    if (!state) return;
    const manual = [...(state.manual || [])];
    manual[i] = { ...manual[i], ...patch, updatedAt: new Date().toISOString() };
    setState({ ...state, manual });
  }

  const pending = submissions.filter((s) => s.status === "pending");

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1>Admin</h1>
      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
        <div style={{ fontWeight: 700 }}>Admin token</div>
        <input
          value={token}
          onChange={(e) => saveToken(e.target.value)}
          placeholder="Paste ADMIN_TOKEN"
          style={{ width: "100%", marginTop: 8 }}
        />
        <button onClick={load} style={{ marginTop: 10, padding: "8px 12px" }}>
          Load admin data
        </button>
        {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
      </div>

      <div style={{ marginTop: 18 }}>
        <h2>Pending submissions</h2>
        {pending.length === 0 ? (
          <p>No pending submissions.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {pending.map((s) => (
              <li key={s.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>{s.title}</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  {s.course} · {s.type}
                </div>
                <a href={s.fileUrl} target="_blank" rel="noreferrer">
                  Open file
                </a>
                <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                  <button onClick={() => review(s.id, "approve")}>Approve</button>
                  <button onClick={() => review(s.id, "reject")}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <h2>Manual status editor</h2>
        <button onClick={addManual}>Add status item</button>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          {(state?.manual || []).map((x: any, i: number) => (
            <div key={x.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <input
                value={x.title}
                onChange={(e) => updateManual(i, { title: e.target.value })}
                style={{ width: "100%", fontWeight: 700 }}
              />
              <textarea
                value={x.message}
                onChange={(e) => updateManual(i, { message: e.target.value })}
                style={{ width: "100%", marginTop: 8, minHeight: 60 }}
              />
              <select
                value={x.severity}
                onChange={(e) => updateManual(i, { severity: e.target.value })}
                style={{ marginTop: 8 }}
              >
                <option value="ok">ok</option>
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="down">down</option>
              </select>
            </div>
          ))}
        </div>
        <button onClick={saveStatus} style={{ marginTop: 10, padding: "8px 12px" }}>
          Save status
        </button>
      </div>
    </div>
  );
}
