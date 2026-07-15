"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import MessageBoard from "@/components/MessageBoard";
import MetricsSection from "@/components/MetricsSection";

type MyProfile = {
  id: string;
  name: string;
  nextMeetingAt: string | null;
  zoomLink: string | null;
  ninetyDayPlan: string | null;
  notesAsClient: { id: string; content: string; createdAt: string; author: { name: string } }[];
  wins: { id: string; content: string; createdAt: string }[];
  resources: { id: string; title: string; url: string | null; description: string | null }[];
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<MyProfile | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/clients/${session.user.id}`)
      .then((r) => r.json())
      .then(setProfile);
  }, [session?.user?.id]);

  if (!session || !profile) {
    return <main className="px-6 py-10 max-w-4xl mx-auto text-sm text-ink/40">Loading…</main>;
  }

  const meetingSoon =
    profile.nextMeetingAt && new Date(profile.nextMeetingAt).getTime() - Date.now() < 1000 * 60 * 60 * 24;

  function downloadPlan() {
    if (!profile?.ninetyDayPlan) return;
    const blob = new Blob([profile.ninetyDayPlan], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, "-")}-90-day-plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl text-ink">Welcome back, {profile.name.split(" ")[0]}</h1>
          <p className="text-sm text-ink/60 mt-1">Here's everything from your coaching space.</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="focus-ring text-sm text-ink/50 hover:text-ink underline underline-offset-4"
        >
          Sign out
        </button>
      </header>

      <section
        className={`rounded-card p-6 mb-6 border ${
          meetingSoon ? "bg-gold-light border-gold" : "bg-panel border-line"
        }`}
      >
        <h2 className="font-display text-lg mb-2">Next session</h2>
        {profile.nextMeetingAt ? (
          <>
            <p className="font-mono text-sm">
              {new Date(profile.nextMeetingAt).toLocaleString()}
            </p>
            {profile.zoomLink && (
              <a
                href={profile.zoomLink}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-block mt-3 rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
              >
                Join Zoom
              </a>
            )}
          </>
        ) : (
          <p className="text-sm text-ink/50 italic">Nothing scheduled yet.</p>
        )}
      </section>

      {profile.ninetyDayPlan && (
        <section className="bg-panel border border-line rounded-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">Your 90-Day Plan</h2>
            <button
              onClick={downloadPlan}
              className="focus-ring rounded-md border border-line text-ink text-sm font-medium px-3 py-1.5 hover:border-teal transition-colors"
            >
              Download
            </button>
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-ink/80">
            {profile.ninetyDayPlan}
          </p>
        </section>
      )}

      <MetricsSection clientId={profile.id} />

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="bg-panel border border-line rounded-card p-6">
          <h2 className="font-display text-lg mb-4">Coaching notes</h2>
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {profile.notesAsClient.length === 0 && (
              <p className="text-sm text-ink/40 italic">No notes yet.</p>
            )}
            {profile.notesAsClient.map((n) => (
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
          <h2 className="font-display text-lg mb-4">Your wins</h2>
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {profile.wins.length === 0 && (
              <p className="text-sm text-ink/40 italic">Your wins will show up here.</p>
            )}
            {profile.wins.map((w) => (
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
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {profile.resources.length === 0 && (
              <p className="text-sm text-ink/40 italic">Nothing shared yet.</p>
            )}
            {profile.resources.map((r) => (
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
          <h2 className="font-display text-lg mb-4">Message Michael or Ben</h2>
          <MessageBoard clientId={profile.id} currentUserId={session.user.id} />
        </section>
      </div>
    </main>
  );
}
