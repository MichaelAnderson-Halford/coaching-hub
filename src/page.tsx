"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("That email and password don't match our records.");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    router.push(session?.user?.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="font-display text-3xl leading-none tracking-tight">
            <span className="text-ink">PROVIDER</span>{" "}
            <span className="text-teal">PRO</span>
          </p>
          <div
            className="mx-auto mt-4 mb-5 h-1 w-40 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #E5177C, #6B4FA0, #2AA9C4, #6DBE2C, #D89A2E)",
            }}
          />
          <p className="text-sm text-ink/60">
            Sign in to pick up where your last session left off.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-panel border border-line rounded-card p-8 shadow-sm"
        >
          <label className="block mb-4">
            <span className="text-sm font-medium text-ink/80">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-ink/80">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="focus-ring w-full rounded-md bg-teal text-white text-sm font-medium py-2.5 hover:bg-teal-dark transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink/40">
          Access is set up by Michael or Ben. Reach out to them if you need an invite.
        </p>
      </div>
    </main>
  );
}
