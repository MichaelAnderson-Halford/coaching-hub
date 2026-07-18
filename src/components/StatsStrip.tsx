type ActivityDate = { createdAt: string };

function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Group activity into ISO week buckets (year-week number), then count
  // how many consecutive weeks (ending this week or last week) have at
  // least one entry.
  function weekKey(d: Date): string {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-${weekNum}`;
  }

  const weeksWithActivity = new Set(dates.map(weekKey));
  let streak = 0;
  const cursor = new Date();

  // Allow the current week to be empty so far without breaking the streak.
  if (!weeksWithActivity.has(weekKey(cursor))) {
    cursor.setDate(cursor.getDate() - 7);
  }

  while (weeksWithActivity.has(weekKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}

export default function StatsStrip({
  createdAt,
  wins,
  notes,
  metricEntryDates,
}: {
  createdAt: string;
  wins: ActivityDate[];
  notes: ActivityDate[];
  metricEntryDates: string[];
}) {
  const allDates = [
    ...wins.map((w) => new Date(w.createdAt)),
    ...notes.map((n) => new Date(n.createdAt)),
    ...metricEntryDates.map((d) => new Date(d)),
  ];
  const streak = computeStreak(allDates);

  const daysAsClient = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const stats = [
    { label: "Week streak", value: streak, color: "bg-teal-light text-teal-dark" },
    { label: "Wins logged", value: wins.length, color: "bg-gold-light text-gold" },
    { label: "Days on your journey", value: daysAsClient, color: "bg-panel text-ink" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className={`${s.color} rounded-card p-4 text-center`}>
          <p className="font-display text-3xl">{s.value}</p>
          <p className="text-xs mt-1 opacity-80">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
