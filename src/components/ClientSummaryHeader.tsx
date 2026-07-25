"use client";

// Tunable thresholds for attention badges — adjust here as we learn what's
// actually useful in practice, rather than digging through JSX to find them.
export const PLAN_NUDGE_DAYS = 7;
export const METRICS_NUDGE_DAYS = 7;
export const METRIC_STALE_DAYS = 30;
export const SESSION_STALE_DAYS = 14;

function daysSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

type MetricEntry = { recordedAt: string };
type Metric = { entries: MetricEntry[] };
type Business = { metrics: Metric[] };
type Session = { date: string };
type HomeworkItem = { dueDate: string | null; completed: boolean };
type ThreadMessage = { readByCoach: boolean; senderId: string };

export type ClientForBadges = {
  id: string;
  createdAt: string;
  plan: { id: string } | null;
  businesses: Business[];
  sessions: Session[];
  homeworkItems: HomeworkItem[];
  threadMessages: ThreadMessage[];
};

export function computeTabBadges(client: ClientForBadges, currentUserId?: string) {
  const clientAgeDays = daysSince(client.createdAt);

  const planBadge = !client.plan && clientAgeDays > PLAN_NUDGE_DAYS;

  const allMetrics = client.businesses.flatMap((b) => b.metrics);
  const hasNoMetrics = allMetrics.length === 0;
  const latestEntryAges = allMetrics
    .flatMap((m) => m.entries)
    .map((e) => daysSince(e.recordedAt));
  const staleMetrics = latestEntryAges.length > 0 && Math.min(...latestEntryAges) > METRIC_STALE_DAYS;
  const businessesBadge = (hasNoMetrics && clientAgeDays > METRICS_NUDGE_DAYS) || staleMetrics;

  const lastSessionAge =
    client.sessions.length > 0 ? Math.min(...client.sessions.map((s) => daysSince(s.date))) : Infinity;
  const timelineBadge = lastSessionAge > SESSION_STALE_DAYS;

  const projectsBadge = client.homeworkItems.some(
    (h) => !h.completed && h.dueDate && new Date(h.dueDate).getTime() < Date.now()
  );

  const messagesBadge = client.threadMessages.some(
    (m) => !m.readByCoach && m.senderId !== currentUserId
  );

  return {
    Plan: planBadge,
    Businesses: businessesBadge,
    Timeline: timelineBadge,
    Projects: projectsBadge,
    Messages: messagesBadge,
  };
}

export default function ClientSummaryHeader({
  name,
  createdAt,
  sessionCount,
  nextMeetingAt,
}: {
  name: string;
  createdAt: string;
  sessionCount: number;
  nextMeetingAt: string | null;
}) {
  const clientSince = new Date(createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <section className="bg-panel border border-line rounded-card p-6 mb-6 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-teal text-white font-display text-lg shrink-0">
          {initials(name)}
        </div>
        <div>
          <h1 className="font-display text-2xl text-ink">{name}</h1>
          <p className="text-sm text-ink/50 mt-0.5">
            Client since {clientSince} · {sessionCount} session{sessionCount === 1 ? "" : "s"} logged
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs font-medium text-ink/40 uppercase tracking-wide">Next session</p>
        {nextMeetingAt ? (
          <p className="font-mono text-sm text-ink mt-1">
            {new Date(nextMeetingAt).toLocaleString()}
          </p>
        ) : (
          <p className="text-sm text-ink/40 italic mt-1">Not scheduled</p>
        )}
      </div>
    </section>
  );
}
