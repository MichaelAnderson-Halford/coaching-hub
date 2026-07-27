"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Always show the same confirmation, whether or not the email
      // exists — this prevents the form from being used to check which
      // emails are registered.
      setSubmitted(true);
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl leading-none tracking-tight">
            <span className="text-ink">PROVIDER</span>{" "}
            <span className="text-teal">PRO</span>
          </p>
        </div>

        <div className="bg-panel border border-line rounded-card p-8 shadow-sm">
          <h1 className="font-display text-xl text-ink mb-2">Reset your password</h1>

          {submitted ? (
            <p className="text-sm text-ink/70">
              If that email is registered, we've sent a link to reset your password.
              Check your inbox.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink/60 mb-6">
                Enter your email and we'll send you a link to set a new password.
              </p>
              <form onSubmit={submit}>
                <label className="block mb-6">
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
                <button
                  type="submit"
                  disabled={submitting}
                  className="focus-ring w-full rounded-md bg-teal text-white text-sm font-medium py-2.5 hover:bg-teal-dark transition-colors disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink/40">
          <Link href="/" className="underline underline-offset-2 hover:text-ink">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
