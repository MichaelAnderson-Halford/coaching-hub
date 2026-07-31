"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Settings = {
  heroHeadline: string | null;
  heroSubheadline: string | null;
  aboutText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export default function SiteSettingsPage() {
  const [form, setForm] = useState<Settings>({
    heroHeadline: "",
    heroSubheadline: "",
    aboutText: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          heroHeadline: data.heroHeadline || "",
          heroSubheadline: data.heroSubheadline || "",
          aboutText: data.aboutText || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
        });
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return <main className="px-6 py-10 max-w-2xl mx-auto text-sm text-ink/40">Loading…</main>;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <Link href="/master" className="focus-ring text-sm text-ink/50 hover:text-ink">
        ← Back to Master Portal
      </Link>

      <h1 className="font-display text-3xl text-ink mt-4 mb-2">Website Content</h1>
      <p className="text-sm text-ink/60 mb-8">
        This content appears on the main sign-in page, below the login form.
      </p>

      <form onSubmit={save} className="bg-panel border border-line rounded-card p-6 space-y-5">
        <label className="block">
          <span className="text-xs font-medium text-ink/60">Hero headline</span>
          <input
            value={form.heroHeadline || ""}
            onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
            placeholder="e.g. The all-in-one platform for coaches"
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink/60">Hero subheadline</span>
          <input
            value={form.heroSubheadline || ""}
            onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })}
            placeholder="e.g. Manage clients, track progress, and grow your coaching business"
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-ink/60">About / description</span>
          <textarea
            value={form.aboutText || ""}
            onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
            rows={5}
            placeholder="A longer description of what the platform offers…"
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Contact email</span>
            <input
              value={form.contactEmail || ""}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="hello@thecoachbook.app"
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Contact phone</span>
            <input
              value={form.contactPhone || ""}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="+44 …"
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-sm text-teal">Saved!</span>}
        </div>
      </form>
    </main>
  );
}
