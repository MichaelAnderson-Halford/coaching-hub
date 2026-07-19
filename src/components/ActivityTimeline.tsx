"use client";

type Note = { id: string; content: string; createdAt: string; isPrivate?: boolean; author: { name: string } };
type Win = { id: string; content: string; createdAt: string };
type MetricEntry = { id: string; value: number; recordedAt: string };
type Metric = { id: string; name: string; unit: string | null; entries: MetricEntry[] };
type Business = { id: string; name: string; metrics: Metric[] };

type TimelineItem = {
  key: string;
  type: "note" | "win" | "metric";
  createdAt: string;
  content: string;
  meta: string;
  isPrivate?: boolean;
};

function buildTimeline(notes: Note[], wins: Win[], businesses: Business[]): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const n of notes) {
    items.push({
      key: `note-${n.id}`,
      type: "note",
      createdAt: n.createdAt,
      content: n.content.replace(/\[\[zoom:[^\]]+\]\]/g, "").trim(),
      meta: n.author.name,
      isPrivate: n.isPrivate,
    });
  }

  for (const w of wins) {
    items.push({
      key: `win-${w.id}`,
      type: "win",
      createdAt: w.createdAt,
      content: w.content,
      meta: "Win",
    });
  }

  for (const b of businesses) {
    for (const m of b.metrics) {
      for (const e of m.entries) {
        items.push({
          key: `metric-${e.id}`,
          type: "metric",
          createdAt: e.recordedAt,
          content: `${m.name}: ${e.value}${m.unit ? ` ${m.unit}` : ""}`,
          meta: b.name,
        });
      }
    }
  }

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const STYLES: Record<TimelineItem["type"], { border: string; icon: string }> = {
  note: { border: "border-teal-light", icon: "📝" },
  win: { border: "border-gold-light", icon: "🏆" },
  metric: { border: "border-line", icon: "📈" },
};

export default function ActivityTimeline({
  notes,
  wins,
  businesses,
}: {
  notes: Note[];
  wins: Win[];
  businesses: Business[];
}) {
  const items = buildTimeline(notes, wins, businesses);

  if (items.length === 0) {
    return <p className="text-sm text-ink/40 italic">Nothing logged yet.</p>;
  }

  return (
    <ul className="space-y-3 max-h-[32rem] overflow-y-auto">
      {items.map((item) => (
        <li
          key={item.key}
          className={`text-sm border-l-2 pl-3 ${STYLES[item.type].border}`}
        >
          <p className="whitespace-pre-wrap">
            <span className="mr-1">{STYLES[item.type].icon}</span>
            {item.isPrivate && <span className="mr-1" title="Private — coach only">🔒</span>}
            {item.content}
          </p>
          <p className="text-xs text-ink/40 font-mono mt-1">
            {item.meta} · {new Date(item.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
