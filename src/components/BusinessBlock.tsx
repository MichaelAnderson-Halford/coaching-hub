"use client";

import { useState } from "react";
import MetricsSection from "@/components/MetricsSection";

type Business = {
  id: string;
  name: string;
  insight: string | null;
  insightUpdatedAt: string | null;
};

export default function BusinessBlock({
  business,
  editable,
  onDelete,
  onRenamed,
}: {
  business: Business;
  editable?: boolean;
  onDelete?: () => void;
  onRenamed?: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(business.name);

  async function saveName() {
    if (!nameDraft.trim()) return;
    await fetch(`/api/businesses/${business.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameDraft }),
    });
    setEditingName(false);
    onRenamed?.();
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="focus-ring flex-1 rounded-md border border-line px-3 py-1.5 text-lg font-display bg-white"
            />
            <button
              onClick={saveName}
              className="focus-ring rounded-md bg-teal text-white text-sm px-3 py-1.5 hover:bg-teal-dark"
            >
              Save
            </button>
            <button
              onClick={() => {
                setNameDraft(business.name);
                setEditingName(false);
              }}
              className="focus-ring text-sm text-ink/50 hover:text-ink px-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <h2 className="font-display text-2xl text-ink">
            {business.name}
            {editable && (
              <button
                onClick={() => setEditingName(true)}
                className="focus-ring ml-3 text-xs font-body text-ink/30 hover:text-teal align-middle underline decoration-dotted underline-offset-2"
              >
                Rename
              </button>
            )}
          </h2>
        )}
        {onDelete && !editingName && (
          <button
            onClick={onDelete}
            className="focus-ring text-xs text-ink/30 hover:text-red-700 transition-colors whitespace-nowrap"
          >
            Delete this business
          </button>
        )}
      </div>

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
