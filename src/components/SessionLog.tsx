"use client";

import { useState } from "react";

type SessionItem = {
  id: string;
  sessionNumber: number;
  date: string;
  durationMinutes: number | null;
  summary: string;
};

export default function SessionLog({
  clientId,
  sessions,
  onChanged,
}: {
  clientId: string;
  sessions: SessionItem[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState("");
  const [summary, setSummary] = useState("");

  async function addSession(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, date, durationMinutes: duration || null, summary }),
    });
    setSummary("");
    setDuration("");
    setShowForm(false);
    onChanged();
  }

  async function remove(id: string) {
    if (!confirm("Delete this session log entry?")) return;
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <section className="bg-panel border border-line rounded-card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg">Session log</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
        >
          {showForm ? "Cancel" : "+ Log a session"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={addSession}
          className="grid gap-3 sm:grid-cols-2 mb-6 border border-line rounded-md p-4"
        >
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Duration (minutes, optional)</span>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-ink/60">Topics covered / summary</span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              placeholder="What was covered in this session…"
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm leading-relaxed"
            />
          </label>
          <button
            type="submit"
            className="focus-ring sm:col-span-2 justify-self-start rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
          >
            Save session
          </button>
        </form>
      )}

      {sessions.length === 0 ? (
        <p className="text-sm text-ink/40 italic">No sessions logged yet.</p>
      ) : (
        <ul className="space-y-4 max-h-[32rem] overflow-y-auto">
          {sessions.map((s) => (
            <li key={s.id} className="border-l-2 border-teal-light pl-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Session #{s.sessionNumber} · {new Date(s.date).toLocaleDateString()}
                  {s.durationMinutes ? ` · ${s.durationMinutes} min` : ""}
                </p>
                <button
                  onClick={() => remove(s.id)}
                  className="focus-ring text-xs text-ink/30 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
              <p className="text-sm text-ink/70 whitespace-pre-wrap mt-1">{s.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
