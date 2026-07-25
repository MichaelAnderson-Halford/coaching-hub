"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type OrgBilling = {
  name: string;
  plan: string;
  trialEndsAt: string | null;
  subscriptionStatus: string | null;
};

const TIERS: { key: "starter" | "growth" | "scale"; label: string; price: string; blurb: string }[] = [
  { key: "starter", label: "Starter", price: "$29/mo", blurb: "Up to ~15 active clients, 1 coach seat" },
  { key: "growth", label: "Growth", price: "$59/mo", blurb: "Up to ~50 active clients, multiple coach seats, custom domain" },
  { key: "scale", label: "Scale", price: "$99+/mo", blurb: "Unlimited clients, priority support" },
];

function BillingContent() {
  const searchParams = useSearchParams();
  const [org, setOrg] = useState<OrgBilling | null>(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then(setOrg);
  }, []);

  async function upgrade(tier: string) {
    setLoadingTier(tier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
        setLoadingTier(null);
      }
    } catch {
      alert("Something went wrong reaching the server");
      setLoadingTier(null);
    }
  }

  if (!org) {
    return <p className="text-sm text-ink/40">Loading…</p>;
  }

  const trialDaysLeft = org.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(org.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <>
      {success && (
        <div className="bg-teal-light border border-teal/30 rounded-card p-4 mb-6 text-sm">
          Payment successful — your plan is now active.
        </div>
      )}
      {canceled && (
        <div className="bg-panel border border-line rounded-card p-4 mb-6 text-sm text-ink/60">
          Checkout was canceled — no changes were made.
        </div>
      )}

      <section className="bg-panel border border-line rounded-card p-6 mb-8">
        <h2 className="font-display text-lg mb-2">Current plan</h2>
        {org.plan === "internal" ? (
          <p className="text-sm text-ink/70">Internal account — no charge.</p>
        ) : org.plan === "paid" ? (
          <p className="text-sm text-ink/70">
            Active subscription ({org.subscriptionStatus === "past_due" ? (
              <span className="text-red-700">payment past due</span>
            ) : (
              "in good standing"
            )})
          </p>
        ) : (
          <p className="text-sm text-ink/70">
            Free trial —{" "}
            {trialDaysLeft !== null && trialDaysLeft > 0
              ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining`
              : "trial has ended"}
          </p>
        )}
      </section>

      {org.plan !== "internal" && org.plan !== "paid" && (
        <section>
          <h2 className="font-display text-lg mb-4">Choose a plan</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.key} className="bg-panel border border-line rounded-card p-5 flex flex-col">
                <h3 className="font-display text-lg text-ink">{t.label}</h3>
                <p className="text-2xl font-display text-ink mt-1">{t.price}</p>
                <p className="text-xs text-ink/50 mt-2 mb-4 flex-1">{t.blurb}</p>
                <button
                  onClick={() => upgrade(t.key)}
                  disabled={loadingTier !== null}
                  className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors disabled:opacity-40"
                >
                  {loadingTier === t.key ? "Redirecting…" : "Choose plan"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function BillingPage() {
  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-8">Billing</h1>
      <Suspense fallback={<p className="text-sm text-ink/40">Loading…</p>}>
        <BillingContent />
      </Suspense>
    </main>
  );
}
