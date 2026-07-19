"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MessageBoard from "@/components/MessageBoard";
import BusinessBlock from "@/components/BusinessBlock";
import ActivityTimeline from "@/components/ActivityTimeline";
import HomeworkSection from "@/components/HomeworkSection";
import SessionLog from "@/components/SessionLog";
import PlanEditor from "@/components/PlanEditor";

type MetricEntry = { id: string; value: number; recordedAt: string };
type Metric = { id: string; name: string; unit: string | null; entries: MetricEntry[] };

type BusinessDetail = {
  id: string;
  name: string;
  insight: string | null;
  insightUpdatedAt: string | null;
  metrics: Metric[];
};

type ClientDetail = {
  id: string;
  name: string;
  email: string;
  nextMeetingAt: string | null;
  zoomLink: string | null;
  archivedAt: string | null;
  ninetyDayPlan: string | null;
  notesAsClient: { id: string; content: string; createdAt: string; isPrivate: boolean; author: { name: string } }[];
  wins: { id: string; content: string; createdAt: string }[];
  resources: { id: string; title: string; url: string | null; description: string | null }[];
  homeworkItems: { id: string; title: string; dueDate: string | null; completed: boolean }[];
  sessions: { id: string; sessionNumber: number; date: string; durationMinutes: number | null; summary: string }[];
  businesses: BusinessDetail[];
};

const TABS = ["Overview", "Plan", "Businesses", "Timeline", "Homework"] as const;
type Tab = (typeof TABS)[number];

export default function AdminClientPage({ params }: { params: { clientId: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const [noteDraft, setNoteDraft] = useState("");
  const [notePrivate, setNotePrivate] = useState(false);
  const [winDraft, setWinDraft] = useState("");
  const [resourceDraft, setResourceDraft] = useState({ title: "", url: "", description: "" });
  const [zoomLink, setZoomLink] = useState("");
  const [nextMeetingAt, setNextMeetingAt] = useState("");
  const [importingZoom, setImportingZoom] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");

  function extractMeetingId(link: string): string | null {
    const match = link.match(/\/j\/(\d+)/);
    return match ? match[1] : null;
  }

  async function load() {
    const res = await fetch(`/api/clients/${params.clientId}`);
    if (res.ok) {
      const data = await res.json();
      setClient(data);
      setZoomLink(data.zoomLink || "");
      setNextMeetingAt(data.nextMeetingAt ? toLocalInput(data.nextMeetingAt) : "");
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

  async function addBusiness(e: React.FormEvent) {
    e.preventDefault();
    if (!newBusinessName.trim()) return;
    await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: params.clientId, name: newBusinessName }),
    });
    setNewBusinessName("");
    setShowAddBusiness(false);
    load();
  }

  async function deleteBusiness(businessId: string, name: string) {
    if (!confirm(`Delete "${name}"? This removes all its metrics too — this can't be undone.`)) {
      return;
    }
    const res = await fetch(`/api/businesses/${businessId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Something went wrong");
      return;
    }
    load();
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: params.clientId, content: noteDraft, isPrivate: notePrivate }),
    });
    setNoteDraft("");
    setNotePrivate(false);
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

  async function archiveClient() {
    if (
      !confirm(
        "Archive this client? They'll be hidden from your active list but nothing is deleted — you can unarchive them later."
      )
    ) {
      return;
    }
    await fetch(`/api/clients/${params.clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    router.push("/admin");
  }

  if (!client) {
    return <main className="px-6 py-10 max-w-4xl mx-auto text-sm text-ink/40">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="focus-ring text-sm text-ink/50 hover:text-ink">
          ← All clients
        </Link>
        <button
          onClick={archiveClient}
          className="focus-ring text-sm text-ink/40 hover:text-red-700 transition-colors"
        >
          Archive client
        </button>
      </div>
      <h1 className="font-display text-3xl text-ink mt-2 mb-6">{client.name}</h1>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-line pb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === activeTab
                ? "bg-teal text-white"
                : "bg-panel border border-line text-ink/70 hover:border-teal"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <>
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
                    <span className="text-teal">Detected meeting ID: {extractMeetingId(zoomLink)}</span>
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

          <div className="grid gap-6 sm:grid-cols-2 items-start">
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
        </>
      )}

      {activeTab === "Plan" && (
        <PlanEditor clientId={client.id} businessNames={client.businesses.map((b) => b.name)} />
      )}

      {activeTab === "Businesses" && (
        <>
          {client.businesses.map((business) => (
            <BusinessBlock
              key={business.id}
              business={business}
              editable
              onRenamed={load}
              onDelete={
                client.businesses.length > 1
                  ? () => deleteBusiness(business.id, business.name)
                  : undefined
              }
            />
          ))}

          <div className="mb-8">
            {showAddBusiness ? (
              <form onSubmit={addBusiness} className="flex gap-2">
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
                <button
                  type="button"
                  onClick={() => setShowAddBusiness(false)}
                  className="focus-ring rounded-md border border-line text-ink/60 text-sm px-4 py-2 hover:text-ink"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowAddBusiness(true)}
                className="focus-ring text-sm text-ink/40 hover:text-ink underline underline-offset-4"
              >
                + This client runs another business? Add it
              </button>
            )}
          </div>
        </>
      )}

      {activeTab === "Timeline" && (
        <>
          <SessionLog clientId={client.id} sessions={client.sessions} onChanged={load} />

          <section className="bg-panel border border-line rounded-card p-6 mb-6">
            <h2 className="font-display text-lg mb-4">Add to the timeline</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <form onSubmit={addNote} className="space-y-2">
                <div className="flex gap-2">
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
                </div>
                <label className="flex items-center gap-2 text-xs text-ink/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notePrivate}
                    onChange={(e) => setNotePrivate(e.target.checked)}
                    className="accent-teal"
                  />
                  🔒 Private — coach only, client never sees this
                </label>
              </form>
              <form onSubmit={addWin} className="flex gap-2">
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
            </div>
          </section>

          <section className="bg-panel border border-line rounded-card p-6 mb-6">
            <h2 className="font-display text-lg mb-4">Activity timeline</h2>
            <ActivityTimeline
              notes={client.notesAsClient}
              wins={client.wins}
              businesses={client.businesses}
            />
          </section>
        </>
      )}

      {activeTab === "Homework" && (
        <HomeworkSection clientId={client.id} items={client.homeworkItems} onChanged={load} />
      )}
    </main>
  );
}
