"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import MessageBoard from "@/components/MessageBoard";
import MetricsSection from "@/components/MetricsSection";

type BusinessDetail = {
  id: string;
  name: string;
  ninetyDayPlan: string | null;
  insight: string | null;
  insightUpdatedAt: string | null;
};

type ClientDetail = {
  id: string;
  name: string;
  email: string;
  nextMeetingAt: string | null;
  zoomLink: string | null;
  notesAsClient: { id: string; content: string; createdAt: string; author: { name: string } }[];
  wins: { id: string; content: string; createdAt: string }[];
  resources: { id: string; title: string; url: string | null; description: string | null }[];
  businesses: BusinessDetail[];
};

export default function AdminClientPage({ params }: { params: { clientId: string } }) {
  const { data: session } = useSession();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);

  const [noteDraft, setNoteDraft] = useState("");
  const [winDraft, setWinDraft] = useState("");
  const [resourceDraft, setResourceDraft] = useState({ title: "", url: "", description: "" });
  const [zoomLink, setZoomLink] = useState("");
  const [nextMeetingAt, setNextMeetingAt] = useState("");
  const [ninetyDayPlan, setNinetyDayPlan] = useState("");
  const [planSaved, setPlanSaved] = useState(false);
  const [importingZoom, setImportingZoom] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");

  const activeBusiness = client?.businesses.find((b) => b.id === activeBusinessId) || null;

  function extractMeetingId(link: string): string | null {
    const match = link.match(/\/j\/(\d+)/);
    return match ? match[1] : null;
  }

  async function load(preserveActiveId?: string) {
    const res = await fetch(`/api/clients/${params.clientId}`);
    if (res.ok) {
      const data = await res.json();
      setClient(data);
      setZoomLink(data.zoomLink || "");
      setNextMeetingAt(data.nextMeetingAt ? toLocalInput(data.nextMeetingAt) : "");
      const keepId = preserveActiveId || activeBusinessId;
      const stillExists = data.businesses.find((b: BusinessDetail) => b.id === keepId);
      const nextActiveId = stillExists ? keepId : data.businesses[0]?.id || null;
      setActiveBusinessId(nextActiveId);
      const nextActive = data.businesses.find((b: BusinessDetail) => b.id === nextActiveId);
      setNinetyDayPlan(nextActive?.ninetyDayPlan || "");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.clientId]);

  function switchBusiness(id: string) {
    setActiveBusinessId(id);
    const b = client?.businesses.find((x) => x.id === id);
    setNinetyDayPlan(b?.ninetyDayPlan || "");
  }

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

  async function addBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!newBusinessName.trim()) return;
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: params.clientId, name: newBusinessName }),
    });
    const created = await res.json();
    setNewBusinessName("");
    setShowAddBusiness(false);
    load(created.id);
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
    if (!activeBusinessId) return;
    await fetch(`/api/businesses/${activeBusinessId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ninetyDayPlan }),
    });
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2000);
    load();
  }

  function downloadPlan() {
    if (!client || !activeBusiness) return;
    const blob = new Blob([ninetyDayPlan], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${client.name.replace(/\s+/g, "-")}-${activeBusiness.name.replace(/\s+/g, "-")}-90-day-plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importZoomNotes() {
    setImportingZoom(true);
    setImportResult(null);
    try {
      const res = await fetch(`/api/clients/${params.clientId}/import-zoom-notes`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setImportResult(data.error || "Something went wrong");
      } else {
        setImportResult(
          `Imported ${data.imported} note${data.imported === 1 ? "" : "s"} (checked ${data.totalInstancesChecked} past calls, ${data.skipped} already imported)`
        );
        load();
      }
    } catch {
      setImportResult("Something went wrong reaching the server");
    } finally {
      setImportingZoom(false);
    }
  }

  if (!client || !activeBusiness) {
    return <main className="px-6 py-10 max-w-4xl mx-auto text-sm text-ink/40">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <Link href="/admin" className="focus-ring text-sm text-ink/50 hover:text-ink">
        ← All clients
      </Link>
      <h1 className="font-display text-3xl text-ink mt-2 mb-6">{client.name}</h1>

      {client.businesses.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {client.businesses.map((b) => (
            <button
              key={b.id}
              onClick={() => switchBusiness(b.id)}
              className={`focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                b.id === activeBusinessId
                  ? "bg-teal text-white"
                  : "bg-panel border border-line text-ink/70 hover:border-teal"
              }`}
            >
              {b.name}
            </button>
          ))}
          <button
            onClick={() => setShowAddBusiness((v) => !v)}
            className="focus-ring rounded-full border border-line text-ink/50 text-sm px-3 py-1.5 hover:border-teal"
          >
            {showAddBusiness ? "Cancel" : "+ Business"}
          </button>
        </div>
      )}

      {client.businesses.length <= 1 && (
        <div className="mb-6">
          <button
            onClick={() => setShowAddBusiness((v) => !v)}
            className="focus-ring text-xs text-ink/40 hover:text-ink underline underline-offset-4"
          >
            {showAddBusiness ? "Cancel" : "This client runs another business? Add it"}
          </button>
        </div>
      )}

      {showAddBusiness && (
        <form onSubmit={addBusiness} className="flex gap-2 mb-6">
          <input
            required
            placeholder="Business name"
            value={newBusinessName}
            onChange={(e) => setNewBusinessName(e.target.value)}
            className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
          >
            Add
          </button>
        </form>
      )}

      {activeBusiness.insight && (
        <section className="bg-teal-light border border-teal/30 rounded-card p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg">🤖 AI Briefing — {activeBusiness.name}</h2>
            {activeBusiness.insightUpdatedAt && (
              <span className="text-xs text-ink/50 font-mono">
                Updated {new Date(activeBusiness.insightUpdatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeBusiness.insight}</p>
        </section>
      )}

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
            <p className="mt-1 text-xs font-mono">
              {zoomLink.trim() === "" ? (
                <span className="text-ink/40">Meeting ID will show here once you enter a link</span>
              ) : extractMeetingId(zoomLink) ? (
                <span className="text-teal">
                  Detected meeting ID: {extractMeetingId(zoomLink)}
                </span>
              ) : (
                <span className="text-gold">
                  No meeting ID detected — Zoom auto-notes won't be able to match this client
                </span>
              )}
            </p>
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

        <div className="mt-4 pt-4 border-t border-line">
          <button
            type="button"
            onClick={importZoomNotes}
            disabled={importingZoom || !extractMeetingId(zoomLink)}
            className="focus-ring rounded-md border border-line text-ink text-sm font-medium px-3 py-1.5 hover:border-teal transition-colors disabled:opacity-40"
          >
            {importingZoom ? "Importing…" : "Import past Zoom AI notes"}
          </button>
          {importResult && <p className="mt-2 text-xs text-ink/60">{importResult}</p>}
        </div>
      </section>

      <section className="bg-panel border border-line rounded-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">90-Day Plan — {activeBusiness.name}</h2>
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

      <MetricsSection businessId={activeBusiness.id} />

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
                <p className="whitespace-pre-wrap">{n.content.replace(/\[\[zoom:[^\]]+\]\]/g, "").trim()}</p>
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
