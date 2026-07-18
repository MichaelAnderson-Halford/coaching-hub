"use client";

import { useEffect, useState } from "react";
import PlanView from "@/components/PlanView";

type Kpi = { name: string; value: string };
type Project = {
  name: string;
  outcome: string;
  keyApproach: string;
  measures: string;
  month1Label: string;
  month2Label: string;
  month3Label: string;
};
type Section = {
  businessName: string;
  theme: string;
  themeDescription: string;
  recommendations: string;
  projects: Project[];
  kpis: Kpi[];
};

const emptyProject: Project = {
  name: "",
  outcome: "",
  keyApproach: "",
  measures: "",
  month1Label: "",
  month2Label: "",
  month3Label: "",
};
const emptyKpi: Kpi = { name: "", value: "" };

export default function PlanEditor({
  clientId,
  businessNames,
}: {
  clientId: string;
  businessNames: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedPlan, setSavedPlan] = useState<any>(null);

  const [quarterLabel, setQuarterLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [advisorName, setAdvisorName] = useState("");
  const [sections, setSections] = useState<Section[]>([]);

  function emptySectionsForBusinesses(): Section[] {
    return businessNames.map((name) => ({
      businessName: name,
      theme: "",
      themeDescription: "",
      recommendations: "",
      projects: [],
      kpis: [],
    }));
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/plan`);
    const data = await res.json();
    setSavedPlan(data);
    if (data) {
      setQuarterLabel(data.quarterLabel || "");
      setStartDate(data.startDate ? data.startDate.slice(0, 10) : "");
      setEndDate(data.endDate ? data.endDate.slice(0, 10) : "");
      setAdvisorName(data.advisorName || "");
      setSections(
        data.sections.map((s: any) => ({
          businessName: s.businessName,
          theme: s.theme || "",
          themeDescription: s.themeDescription || "",
          recommendations: s.recommendations || "",
          projects: s.projects.map((p: any) => ({
            name: p.name,
            outcome: p.outcome,
            keyApproach: p.keyApproach,
            measures: p.measures,
            month1Label: p.month1Label || "",
            month2Label: p.month2Label || "",
            month3Label: p.month3Label || "",
          })),
          kpis: s.kpis.map((k: any) => ({ name: k.name, value: k.value || "" })),
        }))
      );
    } else {
      setSections(emptySectionsForBusinesses());
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  function updateSection(i: number, patch: Partial<Section>) {
    setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addProject(sIdx: number) {
    setSections((prev) =>
      prev.map((s, idx) =>
        idx === sIdx ? { ...s, projects: [...s.projects, { ...emptyProject }] } : s
      )
    );
  }
  function updateProject(sIdx: number, pIdx: number, patch: Partial<Project>) {
    setSections((prev) =>
      prev.map((s, idx) =>
        idx === sIdx
          ? { ...s, projects: s.projects.map((p, i) => (i === pIdx ? { ...p, ...patch } : p)) }
          : s
      )
    );
  }
  function removeProject(sIdx: number, pIdx: number) {
    setSections((prev) =>
      prev.map((s, idx) =>
        idx === sIdx ? { ...s, projects: s.projects.filter((_, i) => i !== pIdx) } : s
      )
    );
  }

  function addKpi(sIdx: number) {
    setSections((prev) =>
      prev.map((s, idx) => (idx === sIdx ? { ...s, kpis: [...s.kpis, { ...emptyKpi }] } : s))
    );
  }
  function updateKpi(sIdx: number, kIdx: number, patch: Partial<Kpi>) {
    setSections((prev) =>
      prev.map((s, idx) =>
        idx === sIdx
          ? { ...s, kpis: s.kpis.map((k, i) => (i === kIdx ? { ...k, ...patch } : k)) }
          : s
      )
    );
  }
  function removeKpi(sIdx: number, kIdx: number) {
    setSections((prev) =>
      prev.map((s, idx) => (idx === sIdx ? { ...s, kpis: s.kpis.filter((_, i) => i !== kIdx) } : s))
    );
  }

  async function save() {
    if (!quarterLabel.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/clients/${clientId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarterLabel, startDate, endDate, advisorName, sections }),
      });
      setEditing(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg">Quarterly Success Plan</h2>
        <button
          onClick={() => setEditing((v) => !v)}
          className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors"
        >
          {editing ? "Cancel" : savedPlan ? "Edit plan" : "+ Build a plan"}
        </button>
      </div>

      {!editing && savedPlan && <PlanView plan={savedPlan} />}
      {!editing && !savedPlan && (
        <p className="text-sm text-ink/40 italic">No structured plan built yet.</p>
      )}

      {editing && (
        <div className="bg-panel border border-line rounded-card p-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-medium text-ink/60">Quarter label</span>
              <input
                value={quarterLabel}
                onChange={(e) => setQuarterLabel(e.target.value)}
                placeholder="Q3 2026"
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink/60">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink/60">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-ink/60">Advisor name</span>
            <input
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              placeholder="Ben Anderson-Halford"
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm sm:w-64"
            />
          </label>

          {sections.map((section, sIdx) => (
            <div key={sIdx} className="border border-line rounded-md p-4 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-ink/60">Business</span>
                <input
                  value={section.businessName}
                  onChange={(e) => updateSection(sIdx, { businessName: e.target.value })}
                  className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm font-display"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block sm:col-span-1">
                  <span className="text-xs font-medium text-ink/60">Theme (one word)</span>
                  <input
                    value={section.theme}
                    onChange={(e) => updateSection(sIdx, { theme: e.target.value })}
                    placeholder="OPEN"
                    className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-ink/60">Theme description</span>
                  <textarea
                    value={section.themeDescription}
                    onChange={(e) => updateSection(sIdx, { themeDescription: e.target.value })}
                    rows={2}
                    className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-ink/60">
                  Personal recommendations (one per line, "Title: description")
                </span>
                <textarea
                  value={section.recommendations}
                  onChange={(e) => updateSection(sIdx, { recommendations: e.target.value })}
                  rows={4}
                  className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
                />
              </label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-ink/60">KPIs</span>
                  <button
                    onClick={() => addKpi(sIdx)}
                    className="focus-ring text-xs text-teal hover:text-teal-dark"
                  >
                    + Add KPI
                  </button>
                </div>
                {section.kpis.map((k, kIdx) => (
                  <div key={kIdx} className="flex gap-2 mb-2">
                    <input
                      value={k.name}
                      onChange={(e) => updateKpi(sIdx, kIdx, { name: e.target.value })}
                      placeholder="Metric name"
                      className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm"
                    />
                    <input
                      value={k.value}
                      onChange={(e) => updateKpi(sIdx, kIdx, { value: e.target.value })}
                      placeholder="Value (or leave for 'To confirm')"
                      className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => removeKpi(sIdx, kIdx)}
                      className="focus-ring text-xs text-ink/30 hover:text-red-700 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-ink/60">Projects</span>
                  <button
                    onClick={() => addProject(sIdx)}
                    className="focus-ring text-xs text-teal hover:text-teal-dark"
                  >
                    + Add project
                  </button>
                </div>
                <div className="space-y-4">
                  {section.projects.map((p, pIdx) => (
                    <div key={pIdx} className="border border-line rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          value={p.name}
                          onChange={(e) => updateProject(sIdx, pIdx, { name: e.target.value })}
                          placeholder="Project name"
                          className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm font-medium"
                        />
                        <button
                          onClick={() => removeProject(sIdx, pIdx)}
                          className="focus-ring text-xs text-ink/30 hover:text-red-700 ml-2"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        value={p.outcome}
                        onChange={(e) => updateProject(sIdx, pIdx, { outcome: e.target.value })}
                        placeholder="Outcome"
                        rows={2}
                        className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <textarea
                          value={p.keyApproach}
                          onChange={(e) =>
                            updateProject(sIdx, pIdx, { keyApproach: e.target.value })
                          }
                          placeholder="Key approach (one per line)"
                          rows={3}
                          className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
                        />
                        <textarea
                          value={p.measures}
                          onChange={(e) => updateProject(sIdx, pIdx, { measures: e.target.value })}
                          placeholder="Measures of progress (one per line)"
                          rows={3}
                          className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          value={p.month1Label}
                          onChange={(e) =>
                            updateProject(sIdx, pIdx, { month1Label: e.target.value })
                          }
                          placeholder="Month 1"
                          className="focus-ring rounded-md border border-line px-3 py-2 text-xs"
                        />
                        <input
                          value={p.month2Label}
                          onChange={(e) =>
                            updateProject(sIdx, pIdx, { month2Label: e.target.value })
                          }
                          placeholder="Month 2"
                          className="focus-ring rounded-md border border-line px-3 py-2 text-xs"
                        />
                        <input
                          value={p.month3Label}
                          onChange={(e) =>
                            updateProject(sIdx, pIdx, { month3Label: e.target.value })
                          }
                          placeholder="Month 3"
                          className="focus-ring rounded-md border border-line px-3 py-2 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={save}
            disabled={saving}
            className="focus-ring rounded-md bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save plan"}
          </button>
        </div>
      )}
    </section>
  );
}
