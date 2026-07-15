"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import MessageBoard from "@/components/MessageBoard";

type ClientDetail = {
  id: string;
  name: string;
  email: string;
  nextMeetingAt: string | null;
  zoomLink: string | null;
  ninetyDayPlan: string | null;
  notesAsClient: { id: string; content: string; createdAt: string; author: { name: string } }[];
  wins: { id: string; content: string; createdAt: string }[];
  resources: { id: string; title: string; url: string | null; description: string | null }[];
};

export default function AdminClientPage({ params }: { params: { clientId: string } }) {
  const { data: session } = useSession();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [winDraft, setWinDraft] = useState("");
  const [resourceDraft, setResourceDraft] = useState({ title: "", url: "", description: "" });
  const [zoomLink, setZoomLink] = useState("");
  const [nextMeetingAt, setNextMeetingAt] = useState("");
  const [ninetyDayPlan, setNinetyDayPlan] = useState("");
  const [planSaved, setPlanSaved] = useState(false);

  async function load() {
    const res = await fetch(`/api/clients/${params.clientId}`);
    if (res.ok) {
      const data = await res.json();
      setClient(data);
      setZoomLink(data.zoomLink || "");
      setNextMeetingAt(data.nextMeetingAt ? toLocalInput(data.nextMeetingAt) : "");
      setNinetyDayPlan(data.ninetyDayPlan || "");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.clientId]);

  function toLocalInput(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }

  async function saveSchedule(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/clients/${params.clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zoomLink,
        nextMeetingAt: nextMeetingAt ? new Date(nextMeetingAt).toISOString() : null,
      }),
    });
    load();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: params.clientId, content: noteDraft }),
    });
    setNoteDraft("");
    load();
  }

  async function addWin(e: React.FormEvent) {
    e.preventDefault();
    if (!winDraft.trim()) return;
    await fetch("/api/wins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: params.clientId, content: winDraft }),
    });
    setWinDraft("");
    load();
  }

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    if (!resourceDraft.title.trim()) return;
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: params.clientId, ...resourceDraft }),
    });
    setResourceDraft({ title: "", url: "", description: "" });
    load();
  }

  async function savePlan(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/clients/${params.clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ninetyDayPlan }),
    });
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2000);
  }

  function downloadPlan() {
    if (!client) return;
    const blob = new Blob([ninetyDayPlan], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${client.name.replace(/\s+/g, "-")}-90-day-plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!client) {
    return <main className="px-6 py-10 max-w-4xl mx-auto text-sm text-ink/40">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <Link href="/admin" className="focus-ring text-sm text-ink/50 hover:text-ink">
        ← All clients
      </Link>
      <h1 className="font-display text-3xl text-ink mt-2 mb-8">{client.name}</h1>

      <section className="bg-panel border border-line rounded-card p-6 mb-6">
        <h2 className="font-display text-lg mb-4">Next session</h2>
        <form onSubmit={saveSchedule} className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Zoom link</span>
            <input
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              placeholder="https://zoom.us/j/…"
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Date &amp; time</span>
            <input
              type="datetime-local"
              value={nextMeetingAt}
              onChange={(e) => setNextMeetingAt(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="focus-ring sm:col-span-2 justify-self-start rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
          >
            Save
          </button>
        </form>
      </section>

      <section className="bg-panel border border-line rounded-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">90-Day Plan</h2>
          <div className="flex items-center gap-3">
            {planSaved && <span className="text-xs text-teal">Saved</span>}
            <button
              type="button"
              onClick={downloadPlan}
              disabled={!ninetyDayPlan.trim()}
              className="focus-ring rounded-md border border-line text-ink text-sm font-medium px-3 py-1.5 hover:border-teal transition-colors disabled:opacity-40"
            >
              Download
            </button>
          </div>
        </div>
        <form onSubmit={savePlan}>
          <textarea
            value={ninetyDayPlan}
            onChange={(e) => setNinetyDayPlan(e.target.value)}
            placeholder="Write out the 90-day plan here…"
            rows={10}
            className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm leading-relaxed"
          />
          <button
            type="submit"
            className="focus-ring mt-3 rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
          >
            Save plan
          </button>
        </form>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 items-start">
        <section className="bg-panel border border-line rounded-card p-6">
          <h2 className="font-display text-lg mb-4">Coaching notes</h2>
          <form onSubmit={addNote} className="mb-4 flex gap-2">
            <input
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add a note from this session…"
              className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="focus-ring rounded-md bg-teal text-white text-sm px-3 py-2 hover:bg-teal-dark"
            >
              Add
            </button>
          </form>
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {client.notesAsClient.map((n) => (
              <li key={n.id} className="text-sm border-l-2 border-teal-light pl-3">
                <p>{n.content}</p>
                <p className="text-xs text-ink/40 font-mono mt-1">
                  {n.author.name} · {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-panel border border-line rounded-card p-6">
          <h2 className="font-display text-lg mb-4">Wins</h2>
          <form onSubmit={addWin} className="mb-4 flex gap-2">
            <input
              value={winDraft}
              onChange={(e) => setWinDraft(e.target.value)}
              placeholder="Log a win…"
              className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="focus-ring rounded-md bg-gold text-white text-sm px-3 py-2 hover:opacity-90"
            >
              Add
            </button>
          </form>
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {client.wins.map((w) => (
              <li key={w.id} className="text-sm border-l-2 border-gold-light pl-3">
                <p>{w.content}</p>
                <p className="text-xs text-ink/40 font-mono mt-1">
                  {new Date(w.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-panel border border-line rounded-card p-6">
          <h2 className="font-display text-lg mb-4">Resources</h2>
          <form onSubmit={addResource} className="mb-4 space-y-2">
            <input
              value={resourceDraft.title}
              onChange={(e) => setResourceDraft({ ...resourceDraft, title: e.target.value })}
              placeholder="Title"
              className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
            />
            <input
              value={resourceDraft.url}
              onChange={(e) => setResourceDraft({ ...resourceDraft, url: e.target.value })}
              placeholder="Link (optional)"
              className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="focus-ring rounded-md bg-teal text-white text-sm px-3 py-2 hover:bg-teal-dark"
            >
              Add resource
            </button>
          </form>
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {client.resources.map((r) => (
              <li key={r.id} className="text-sm">
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal underline underline-offset-2"
                  >
                    {r.title}
                  </a>
                ) : (
                  <p className="font-medium">{r.title}</p>
                )}
                {r.description && <p className="text-ink/60 text-xs mt-0.5">{r.description}</p>}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-panel border border-line rounded-card p-6">
          <h2 className="font-display text-lg mb-4">Messages</h2>
          {session?.user?.id && (
            <MessageBoard clientId={client.id} currentUserId={session.user.id} />
          )}
        </section>
      </div>
    </main>
  );
}