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

type AdminSummary = {
  id: string;
  name: string;
  email: string;
};

type UpcomingSession = {
  id: string;
  name: string;
  nextMeetingAt: string;
  zoomLink: string | null;
};

type NeedsAttentionClient = {
  id: string;
  name: string;
  lastActivityAt: string | null;
  daysSince: number | null;
};

type ActivityItem = {
  type: "note" | "win" | "message";
  id: string;
  clientId: string;
  clientName: string;
  createdAt: string;
  summary: string;
  content: string;
};

export default function AdminPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [coachForm, setCoachForm] = useState({ name: "", email: "", password: "" });
  const [coachError, setCoachError] = useState<string | null>(null);

  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [needsAttention, setNeedsAttention] = useState<NeedsAttentionClient[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [showArchived, setShowArchived] = useState(false);
  const [archivedClients, setArchivedClients] = useState<ClientSummary[]>([]);

  async function loadOverview() {
    setOverviewLoading(true);
    const res = await fetch("/api/admin/overview");
    if (res.ok) {
      const data = await res.json();
      setUpcomingSessions(data.upcomingSessions);
      setNeedsAttention(data.needsAttention);
      setActivity(data.activity);
    }
    setOverviewLoading(false);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }

  async function loadAdmins() {
    const res = await fetch("/api/admins");
    if (res.ok) setAdmins(await res.json());
  }

  async function loadArchived() {
    const res = await fetch("/api/clients?archived=true");
    if (res.ok) setArchivedClients(await res.json());
  }

  async function toggleArchived() {
    const next = !showArchived;
    setShowArchived(next);
    if (next) loadArchived();
  }

  async function unarchiveClient(id: string) {
    await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: false }),
    });
    loadArchived();
    load();
  }

  useEffect(() => {
    load();
    loadAdmins();
    loadOverview();
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

  async function createCoach(e: React.FormEvent) {
    e.preventDefault();
    setCoachError(null);
    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coachForm),
    });
    if (!res.ok) {
      const body = await res.json();
      setCoachError(body.error || "Something went wrong");
      return;
    }
    setCoachForm({ name: "", email: "", password: "" });
    setShowCoachForm(false);
    loadAdmins();
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl text-ink">Clients</h1>
          <p className="text-sm text-ink/60 mt-1">Every active coaching relationship, in one view.</p>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/admin/zoom-history"
            className="focus-ring text-sm text-ink/50 hover:text-ink underline underline-offset-4"
          >
            Import Zoom history
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="focus-ring text-sm text-ink/50 hover:text-ink underline underline-offset-4"
          >
            Sign out
          </button>
        </div>
      </header>

      {!overviewLoading && (
        <div className="grid gap-6 sm:grid-cols-2 mb-10">
          <section className="bg-panel border border-line rounded-card p-5">
            <h2 className="font-display text-base text-ink mb-3">This week</h2>
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-ink/40 italic">No sessions scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingSessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <Link href={`/admin/${s.id}`} className="focus-ring hover:text-teal">
                      {s.name}
                    </Link>
                    <span className="font-mono text-xs text-ink/60">
                      {new Date(s.nextMeetingAt).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-panel border border-line rounded-card p-5">
            <h2 className="font-display text-base text-ink mb-3">Needs attention</h2>
            {needsAttention.length === 0 ? (
              <p className="text-sm text-ink/40 italic">Everyone's up to date.</p>
            ) : (
              <ul className="space-y-3">
                {needsAttention.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <Link href={`/admin/${c.id}`} className="focus-ring hover:text-teal">
                      {c.name}
                    </Link>
                    <span className="text-xs text-gold">
                      {c.daysSince === null ? "No activity yet" : `${c.daysSince}d quiet`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-panel border border-line rounded-card p-5 sm:col-span-2">
            <h2 className="font-display text-base text-ink mb-3">Recent activity</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-ink/40 italic">Nothing yet.</p>
            ) : (
              <ul className="space-y-3 max-h-64 overflow-y-auto">
                {activity.map((a) => (
                  <li key={`${a.type}-${a.id}`} className="text-sm border-l-2 border-teal-light pl-3">
                    <Link href={`/admin/${a.clientId}`} className="focus-ring hover:text-teal">
                      <span className="font-medium">{a.clientName}</span>
                    </Link>{" "}
                    <span className="text-ink/60">— {a.summary}</span>
                    <p className="text-xs text-ink/40 mt-0.5 line-clamp-1">{a.content}</p>
                    <p className="text-xs text-ink/30 font-mono">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
        >
          {showForm ? "Cancel" : "+ Add a client"}
        </button>
        <span className="text-xs text-ink/40">
          or send new clients your{" "}
          <a href="/intake" target="_blank" className="underline hover:text-ink">
            signup link
          </a>{" "}
          to set themselves up
        </span>
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

      <div className="mt-4">
        <button
          onClick={toggleArchived}
          className="focus-ring text-xs text-ink/40 hover:text-ink underline underline-offset-4"
        >
          {showArchived ? "Hide archived clients" : "View archived clients"}
        </button>
      </div>

      {showArchived && (
        <div className="mt-4">
          {archivedClients.length === 0 ? (
            <p className="text-sm text-ink/40 italic">No archived clients.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {archivedClients.map((c) => (
                <li
                  key={c.id}
                  className="bg-panel border border-line rounded-card p-5 opacity-60 flex items-center justify-between"
                >
                  <div>
                    <p className="font-display text-lg text-ink">{c.name}</p>
                    <p className="text-xs text-ink/50">{c.email}</p>
                  </div>
                  <button
                    onClick={() => unarchiveClient(c.id)}
                    className="focus-ring rounded-md border border-line text-ink text-xs px-3 py-1.5 hover:border-teal transition-colors"
                  >
                    Unarchive
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <hr className="border-line my-10" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Coaches</h2>
          <p className="text-sm text-ink/60 mt-1">Everyone with admin access to this hub.</p>
        </div>
        <button
          onClick={() => setShowCoachForm((v) => !v)}
          className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
        >
          {showCoachForm ? "Cancel" : "+ Add a coach"}
        </button>
      </div>

      {showCoachForm && (
        <form
          onSubmit={createCoach}
          className="bg-panel border border-line rounded-card p-6 mb-8 grid gap-4 sm:grid-cols-3"
        >
          <input
            required
            placeholder="Full name"
            value={coachForm.name}
            onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={coachForm.email}
            onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          />
          <input
            required
            type="text"
            placeholder="Temporary password"
            value={coachForm.password}
            onChange={(e) => setCoachForm({ ...coachForm, password: e.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          />
          {coachError && <p className="sm:col-span-3 text-sm text-red-700">{coachError}</p>}
          <button
            type="submit"
            className="focus-ring sm:col-span-3 rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
          >
            Create coach account
          </button>
        </form>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {admins.map((a) => (
          <li key={a.id} className="bg-panel border border-line rounded-card p-5">
            <p className="font-display text-lg text-ink">{a.name}</p>
            <p className="text-xs text-ink/50">{a.email}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
