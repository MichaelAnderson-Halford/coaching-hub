"use client";

import MetricsSection from "@/components/MetricsSection";

type Business = {
  id: string;
  name: string;
  insight: string | null;
  insightUpdatedAt: string | null;
};

export default function BusinessBlock({ business }: { business: Business }) {
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

      <MetricsSection businessId={business.id} />
    </div>
  );
}
