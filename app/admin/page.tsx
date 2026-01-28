"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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
    setMsg("✅ Saved successfully!");
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-600">Manage submissions and status updates</p>
          </div>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Authentication</h2>
          <input
            type="password"
            value={token}
            onChange={(e) => saveToken(e.target.value)}
            placeholder="Enter ADMIN_TOKEN"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
          />
          <button
            onClick={load}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Load Admin Data
          </button>
          {msg && (
            <p className={`mt-3 text-sm ${msg.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {msg}
            </p>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Submissions ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-gray-500">No pending submissions.</p>
          ) : (
            <div className="space-y-4">
              {pending.map((s) => (
                <div key={s.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {s.course} • {s.type}
                  </p>
                  <a
                    href={s.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Open file →
                  </a>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => review(s.id, "approve")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => review(s.id, "reject")}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Manual Status Items</h2>
            <button
              onClick={addManual}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + Add Status Item
            </button>
          </div>
          <div className="space-y-4">
            {(state?.manual || []).map((x: any, i: number) => (
              <div key={x.id} className="border border-gray-200 rounded-lg p-4">
                <input
                  value={x.title}
                  onChange={(e) => updateManual(i, { title: e.target.value })}
                  placeholder="Status title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold placeholder:text-gray-400"
                />
                <textarea
                  value={x.message}
                  onChange={(e) => updateManual(i, { message: e.target.value })}
                  placeholder="Status message"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2 placeholder:text-gray-400"
                  rows={3}
                />
                <select
                  value={x.severity}
                  onChange={(e) => updateManual(i, { severity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                >
                  <option value="ok">✓ OK (Green)</option>
                  <option value="info">ℹ Info (Blue)</option>
                  <option value="warn">⚠ Warning (Yellow)</option>
                  <option value="down">✗ Down (Red)</option>
                </select>
              </div>
            ))}
          </div>
          {(state?.manual || []).length > 0 && (
            <button
              onClick={saveStatus}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              💾 Save All Changes
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
