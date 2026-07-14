"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type ClientSummary = {
  id: string;
  name: string;
  email: string;
  nextMeetingAt: string | null;
  zoomLink: string | null;
};

export default function AdminPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error || "Something went wrong");
      return;
    }
    setForm({ name: "", email: "", password: "" });
    setShowForm(false);
    load();
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl text-ink">Clients</h1>
          <p className="text-sm text-ink/60 mt-1">Every active coaching relationship, in one view.</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="focus-ring text-sm text-ink/50 hover:text-ink underline underline-offset-4"
        >
          Sign out
        </button>
      </header>

      <div className="mb-6">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
        >
          {showForm ? "Cancel" : "+ Add a client"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createClient}
          className="bg-panel border border-line rounded-card p-6 mb-8 grid gap-4 sm:grid-cols-3"
        >
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          />
          <input
            required
            type="text"
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          />
          {error && <p className="sm:col-span-3 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            className="focus-ring sm:col-span-3 rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
          >
            Create client account
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-ink/40">Loading…</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-ink/40 italic">No clients yet. Add your first one above.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/${c.id}`}
                className="focus-ring block bg-panel border border-line rounded-card p-5 hover:border-teal transition-colors"
              >
                <p className="font-display text-lg text-ink">{c.name}</p>
                <p className="text-xs text-ink/50">{c.email}</p>
                <p className="mt-3 text-xs font-mono text-ink/60">
                  Next session:{" "}
                  {c.nextMeetingAt
                    ? new Date(c.nextMeetingAt).toLocaleString()
                    : "not scheduled"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}