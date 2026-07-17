"use client";

import { useState } from "react";
import MetricsSection from "@/components/MetricsSection";

type Business = {
  id: string;
  name: string;
  ninetyDayPlan: string | null;
  insight: string | null;
  insightUpdatedAt: string | null;
};

export default function BusinessBlock({
  business,
  clientName,
  onSaved,
}: {
  business: Business;
  clientName: string;
  onSaved: () => void;
}) {
  const [ninetyDayPlan, setNinetyDayPlan] = useState(business.ninetyDayPlan || "");
  const [planSaved, setPlanSaved] = useState(false);

  async function savePlan(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/businesses/${business.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ninetyDayPlan }),
    });
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2000);
    onSaved();
  }

  function downloadPlan() {
    const blob = new Blob([ninetyDayPlan], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clientName.replace(/\s+/g, "-")}-${business.name.replace(/\s+/g, "-")}-90-day-plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mb-8">
      <h2 className="font-display text-2xl text-ink mb-4">{business.name}</h2>

      {business.insight && (
        <section className="bg-teal-light border border-teal/30 rounded-card p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg">🤖 AI Briefing</h3>
            {business.insightUpdatedAt && (
              <span className="text-xs text-ink/50 font-mono">
                Updated {new Date(business.insightUpdatedAt).toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{business.insight}</p>
        </section>
      )}

      <section className="bg-panel border border-line rounded-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">90-Day Plan</h3>
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
            rows={8}
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

      <MetricsSection businessId={business.id} />
    </div>
  );
}
