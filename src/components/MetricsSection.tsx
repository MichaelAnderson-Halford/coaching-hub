"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type MetricEntry = { id: string; value: number; recordedAt: string };
type Metric = { id: string; name: string; unit: string | null; entries: MetricEntry[] };

export default function MetricsSection({ clientId }: { clientId: string }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [metricForm, setMetricForm] = useState({ name: "", unit: "" });
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch(`/api/metrics?clientId=${clientId}`);
    if (res.ok) setMetrics(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function addMetric(e: React.FormEvent) {
    e.preventDefault();
    if (!metricForm.name.trim()) return;
    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, name: metricForm.name, unit: metricForm.unit }),
    });
    setMetricForm({ name: "", unit: "" });
    setShowAddMetric(false);
    load();
  }

  async function addEntry(metricId: string) {
    const raw = valueDrafts[metricId];
    const value = parseFloat(raw);
    if (Number.isNaN(value)) return;
    await fetch(`/api/metrics/${metricId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    setValueDrafts({ ...valueDrafts, [metricId]: "" });
    load();
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-ink">Metrics</h2>
        <button
          onClick={() => setShowAddMetric((v) => !v)}
          className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
        >
          {showAddMetric ? "Cancel" : "+ Add a metric"}
        </button>
      </div>

      {showAddMetric && (
        <form
          onSubmit={addMetric}
          className="bg-panel border border-line rounded-card p-6 mb-6 grid gap-4 sm:grid-cols-3"
        >
          <input
            required
            placeholder="Metric name (e.g. Weight)"
            value={metricForm.name}
            onChange={(e) => setMetricForm({ ...metricForm, name: e.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            placeholder="Unit (optional, e.g. kg)"
            value={metricForm.unit}
            onChange={(e) => setMetricForm({ ...metricForm, unit: e.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="focus-ring sm:col-span-3 justify-self-start rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
          >
            Create metric
          </button>
        </form>
      )}

      {metrics.length === 0 ? (
        <p className="text-sm text-ink/40 italic">
          No metrics yet. Add one above to start tracking.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {metrics.map((m) => (
            <div key={m.id} className="bg-panel border border-line rounded-card p-6">
              <h3 className="font-display text-lg text-ink mb-3">
                {m.name}
                {m.unit && <span className="text-ink/50 text-sm font-body"> ({m.unit})</span>}
              </h3>

              {m.entries.length === 0 ? (
                <p className="text-sm text-ink/40 italic mb-4">No data points yet.</p>
              ) : (
                <div className="h-40 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={m.entries.map((e) => ({
                        date: new Date(e.recordedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        }),
                        value: e.value,
                      }))}
                    >
                      <CartesianGrid stroke="#2A2A30" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#8A8A92" fontSize={11} />
                      <YAxis stroke="#8A8A92" fontSize={11} width={36} />
                      <Tooltip
                        contentStyle={{
                          background: "#18181C",
                          border: "1px solid #2A2A30",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "#F5F5F7" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#E5177C"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Log a new value…"
                  value={valueDrafts[m.id] || ""}
                  onChange={(e) =>
                    setValueDrafts({ ...valueDrafts, [m.id]: e.target.value })
                  }
                  className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm"
                />
                <button
                  onClick={() => addEntry(m.id)}
                  className="focus-ring rounded-md bg-teal text-white text-sm px-3 py-2 hover:bg-teal-dark"
                >
                  Log
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
