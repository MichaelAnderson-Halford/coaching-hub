"use client";

import { useState } from "react";

export default function IntakePage() {
  const [form, setForm] = useState({ name: "", email: "", goals: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setResult(data);
    } catch {
      setError("Something went wrong reaching the server");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10">
        <div className="max-w-md w-full bg-panel border border-line rounded-card p-8 text-center">
          <h1 className="font-display text-2xl text-ink mb-3">You're all set!</h1>
          <p className="text-sm text-ink/60 mb-6">
            Your coaching hub account is ready. We've emailed these details too — save them
            somewhere safe.
          </p>
          <div className="bg-white/5 border border-line rounded-md p-4 text-left mb-6 font-mono text-sm">
            <p>Email: {result.email}</p>
            <p>Password: {result.password}</p>
          </div>
          <a
            href="/"
            className="focus-ring inline-block rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
          >
            Sign in now
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-panel border border-line rounded-card p-8"
      >
        <h1 className="font-display text-2xl text-ink mb-2">Get started</h1>
        <p className="text-sm text-ink/60 mb-6">
          Tell us a bit about yourself and we'll get your coaching space set up.
        </p>

        <label className="block mb-4">
          <span className="text-xs font-medium text-ink/60">Full name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xs font-medium text-ink/60">Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <label className="block mb-6">
          <span className="text-xs font-medium text-ink/60">
            What are you hoping to get out of coaching? (optional)
          </span>
          <textarea
            value={form.goals}
            onChange={(e) => setForm({ ...form, goals: e.target.value })}
            rows={4}
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="focus-ring w-full rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors disabled:opacity-50"
        >
          {submitting ? "Setting things up…" : "Create my account"}
        </button>
      </form>
    </main>
  );
}
