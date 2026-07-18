type Metric = {
  id: string;
  name: string;
  unit: string | null;
  target: number | null;
  entries: { value: number }[];
};
type Business = { id: string; name: string; metrics: Metric[] };

function Ring({ percent, color }: { percent: number; color: string }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
      <circle cx="44" cy="44" r={radius} stroke="currentColor" className="text-line" strokeWidth="8" fill="none" />
      <circle
        cx="44"
        cy="44"
        r={radius}
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ProgressRings({ businesses }: { businesses: Business[] }) {
  const withTargets = businesses.flatMap((b) =>
    b.metrics
      .filter((m) => m.target !== null && m.entries.length > 0)
      .map((m) => ({ ...m, businessName: b.name }))
  );

  if (withTargets.length === 0) return null;

  return (
    <section className="bg-panel border border-line rounded-card p-6 mb-6">
      <h2 className="font-display text-lg mb-4">Your progress</h2>
      <div className="flex flex-wrap gap-6">
        {withTargets.map((m) => {
          const latest = m.entries[m.entries.length - 1].value;
          const percent = m.target ? (latest / m.target) * 100 : 0;
          const color = percent >= 100 ? "#D89A2E" : "#E5177C";
          return (
            <div key={m.id} className="flex flex-col items-center gap-2 w-24">
              <div className="relative">
                <Ring percent={percent} color={color} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-sm">{Math.round(percent)}%</span>
                </div>
              </div>
              <p className="text-xs text-center text-ink/70 leading-tight">{m.name}</p>
              <p className="text-xs text-center text-ink/40 font-mono">
                {latest}/{m.target}
                {m.unit ? ` ${m.unit}` : ""}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
