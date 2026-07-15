"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Call = {
  uuid: string;
  startTime: string;
  hasSummary: boolean;
  participants: { name: string; email: string | null }[];
};

type ClientOption = { id: string; name: string; email: string };

export default function ZoomHistoryPage() {
  const [meetingId, setMeetingId] = useState("");
  const [calls, setCalls] = useState<Call[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);

  // Best-effort guess: if a call's attendee email matches a client's email,
  // pre-select that client in the dropdown so there's less manual picking.
  function guessClientId(call: Call): string {
    const match = call.participants.find((p) =>
      clients.some((c) => c.email.toLowerCase() === p.email?.toLowerCase())
    );
    if (!match) return "";
    const client = clients.find((c) => c.email.toLowerCase() === match.email?.toLowerCase());
    return client?.id || "";
  }

  async function loadCalls(e: React.FormEvent) {
    e.preventDefault();
    if (!meetingId.trim()) return;
    setLoading(true);
    setError(null);
    setCalls(null);
    try {
      const res = await fetch(`/api/admin/zoom-history?meetingId=${meetingId.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setCalls(data.calls);
        const guesses: Record<string, string> = {};
        for (const call of data.calls) {
          const guess = guessClientId(call);
          if (guess) guesses[call.uuid] = guess;
        }
        setSelected(guesses);
      }
    } catch {
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  async function importCall(call: Call) {
    const clientId = selected[call.uuid];
    if (!clientId) return;
    setImporting(call.uuid);
    try {
      const res = await fetch("/api/admin/zoom-history/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: call.uuid, clientId, startTime: call.startTime }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImported({ ...imported, [call.uuid]: `Error: ${data.error}` });
      } else {
        const client = clients.find((c) => c.id === clientId);
        setImported({ ...imported, [call.uuid]: `Imported to ${client?.name || "client"}` });
      }
    } catch {
      setImported({ ...imported, [call.uuid]: "Error: could not reach the server" });
    } finally {
      setImporting(null);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <Link href="/admin" className="focus-ring text-sm text-ink/50 hover:text-ink">
        ← All clients
      </Link>
      <h1 className="font-display text-3xl text-ink mt-2 mb-2">Import Zoom History</h1>
      <p className="text-sm text-ink/60 mb-8">
        For calls held before each client had their own dedicated Zoom link. Enter the shared
        meeting room's ID, then match each past call to the right client.
      </p>

      <form onSubmit={loadCalls} className="flex gap-2 mb-8">
        <input
          required
          placeholder="Shared meeting ID (e.g. 1234567890)"
          value={meetingId}
          onChange={(e) => setMeetingId(e.target.value)}
          className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load past calls"}
        </button>
      </form>

      {error && <p className="text-sm text-red-700 mb-6">{error}</p>}

      {calls && calls.length === 0 && (
        <p className="text-sm text-ink/40 italic">No past calls found for that meeting ID.</p>
      )}

      {calls && calls.length > 0 && (
        <ul className="space-y-4">
          {calls.map((call) => (
            <li key={call.uuid} className="bg-panel border border-line rounded-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <p className="font-mono text-sm">
                    {new Date(call.startTime).toLocaleString()}
                  </p>
                  <p className="text-xs text-ink/50 mt-1">
                    {call.participants.length > 0
                      ? call.participants.map((p) => p.name).join(", ")
                      : "No attendee data available"}
                  </p>
                </div>
                {!call.hasSummary && (
                  <span className="text-xs text-ink/40 italic">No AI summary available</span>
                )}
              </div>

              {call.hasSummary && !imported[call.uuid] && (
                <div className="flex gap-2">
                  <select
                    value={selected[call.uuid] || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, [call.uuid]: e.target.value })
                    }
                    className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select a client…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => importCall(call)}
                    disabled={!selected[call.uuid] || importing === call.uuid}
                    className="focus-ring rounded-md bg-teal text-white text-sm px-3 py-2 hover:bg-teal-dark disabled:opacity-50"
                  >
                    {importing === call.uuid ? "Importing…" : "Import"}
                  </button>
                </div>
              )}

              {imported[call.uuid] && (
                <p className="text-xs text-teal">{imported[call.uuid]}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
