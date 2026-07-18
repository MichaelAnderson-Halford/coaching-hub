type Kpi = { id: string; name: string; value: string | null };
type Project = {
  id: string;
  name: string;
  outcome: string;
  keyApproach: string;
  measures: string;
  month1Label: string | null;
  month2Label: string | null;
  month3Label: string | null;
};
type Section = {
  id: string;
  businessName: string;
  theme: string | null;
  themeDescription: string | null;
  recommendations: string | null;
  projects: Project[];
  kpis: Kpi[];
};
type PlanData = {
  quarterLabel: string;
  startDate: string | null;
  endDate: string | null;
  advisorName: string | null;
  sections: Section[];
};

function bulletLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function dateLabel(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

export default function PlanView({ plan }: { plan: PlanData }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-xs tracking-widest text-gold uppercase mb-1">
          {plan.quarterLabel} Success Plan
        </p>
        {(plan.startDate || plan.endDate) && (
          <p className="text-xs text-ink/40 font-mono">
            {dateLabel(plan.startDate)} – {dateLabel(plan.endDate)}
          </p>
        )}
        {plan.advisorName && (
          <p className="text-xs text-ink/40 mt-1">Personally written by {plan.advisorName}</p>
        )}
      </div>

      {plan.sections.map((section) => (
        <div key={section.id} className="bg-panel border border-line rounded-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl">{section.businessName}</h3>
            {section.theme && (
              <span className="bg-teal text-white text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                {section.theme}
              </span>
            )}
          </div>

          {section.themeDescription && (
            <p className="text-sm text-ink/80 leading-relaxed mb-4">{section.themeDescription}</p>
          )}

          {section.recommendations && (
            <div className="mb-6">
              <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">
                Personal recommendations
              </p>
              <ul className="space-y-1">
                {bulletLines(section.recommendations).map((line, i) => {
                  const [title, ...rest] = line.split(":");
                  return (
                    <li key={i} className="text-sm border-l-2 border-gold-light pl-3">
                      {rest.length ? (
                        <>
                          <span className="font-medium">{title}:</span>
                          {rest.join(":")}
                        </>
                      ) : (
                        line
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {section.kpis.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {section.kpis.map((k) => (
                <div key={k.id} className="bg-gold-light rounded-md p-3 text-center">
                  <p className="text-xs text-ink/50">{k.value || "To confirm"}</p>
                  <p className="text-xs font-medium mt-1">{k.name}</p>
                </div>
              ))}
            </div>
          )}

          {section.projects.length > 0 && (
            <div className="space-y-4">
              {section.projects.map((p, i) => (
                <div key={p.id} className="border border-line rounded-md p-4">
                  <p className="font-display text-sm mb-1">
                    {i + 1}. {p.name}
                  </p>
                  <p className="text-sm text-ink/70 mb-3">{p.outcome}</p>

                  <div className="grid gap-4 sm:grid-cols-2 mb-3">
                    <div>
                      <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-1">
                        Key approach
                      </p>
                      <ul className="text-sm space-y-0.5">
                        {bulletLines(p.keyApproach).map((l, li) => (
                          <li key={li}>• {l}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-1">
                        Measures of progress
                      </p>
                      <ul className="text-sm space-y-0.5">
                        {bulletLines(p.measures).map((l, li) => (
                          <li key={li}>• {l}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {(p.month1Label || p.month2Label || p.month3Label) && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[p.month1Label, p.month2Label, p.month3Label].map((m, mi) => (
                        <div
                          key={mi}
                          className="bg-teal-light rounded-md p-2 text-center text-xs font-medium"
                        >
                          {m || "—"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
