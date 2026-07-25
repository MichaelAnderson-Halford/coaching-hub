"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setDone(true);
        setTimeout(() => router.push("/"), 2000);
      }
    } catch {
      setError("Something went wrong reaching the server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-panel border border-line rounded-card p-8">
        <h1 className="font-display text-2xl text-ink mb-2">Set your password</h1>

        {done ? (
          <p className="text-sm text-teal">
            Password set! Redirecting you to sign in…
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-4">
            <label className="block">
              <span className="text-xs font-medium text-ink/60">New password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink/60">Confirm password</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="focus-ring w-full rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors disabled:opacity-40"
            >
              {submitting ? "Saving…" : "Set password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
