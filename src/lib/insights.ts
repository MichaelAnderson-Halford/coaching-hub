import { prisma } from "./prisma";

export async function refreshBusinessInsight(businessId: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return; // Not configured yet — skip quietly rather than break saves.

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      metrics: { include: { entries: { orderBy: { recordedAt: "desc" }, take: 10 } } },
      client: {
        select: {
          name: true,
          notesAsClient: {
            orderBy: { createdAt: "desc" },
            take: 15,
            include: { author: { select: { name: true } } },
          },
          wins: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      },
    },
  });
  if (!business) return;

  const notesText =
    business.client.notesAsClient
      .map(
        (n: { createdAt: Date; content: string }) =>
          `- (${n.createdAt.toISOString().slice(0, 10)}) ${n.content
            .replace(/\[\[zoom:[^\]]+\]\]/g, "")
            .trim()}`
      )
      .join("\n") || "None yet.";

  const winsText =
    business.client.wins.map((w: { content: string }) => `- ${w.content}`).join("\n") ||
    "None yet.";

  const metricsText =
    business.metrics
      .map((m: { name: string; unit: string | null; target: number | null; entries: { value: number }[] }) => {
        const latest = m.entries[0];
        const target = m.target !== null ? `${m.target}${m.unit ? " " + m.unit : ""}` : "no target set";
        return `- ${m.name}: target ${target}, latest value ${latest ? latest.value : "none logged"}`;
      })
      .join("\n") || "No metrics tracked yet.";

  const planText = business.ninetyDayPlan?.trim() || "No 90-day plan written yet.";

  const prompt = `You are helping a business coach prepare for their next session with a client named ${business.client.name}, specifically regarding their business "${business.name}".

Recent coaching notes (shared across all of this client's businesses):
${notesText}

Logged wins (shared across all of this client's businesses):
${winsText}

Tracked metrics for "${business.name}" specifically:
${metricsText}

90-day plan for "${business.name}":
${planText}

Write a concise briefing (under 200 words) covering: (1) overall progress on this specific business, (2) any risks or things stalling, (3) opportunities or wins to build on, (4) one or two suggested focus areas for the next session. Write directly to the coach, in plain prose, no headers or bullet lists.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return;
    const data = await res.json();
    const text = (data.content || []).map((b: any) => b.text || "").join("");
    if (!text.trim()) return;

    await prisma.business.update({
      where: { id: businessId },
      data: { insight: text.trim(), insightUpdatedAt: new Date() },
    });
  } catch {
    // Insight generation failing should never block the actual save the
    // person was trying to make.
  }
}

// Refreshes every business belonging to a client — used after something
// shared (a note or a win) changes, since it could affect any of them.
export async function refreshAllBusinessInsights(clientId: string) {
  const businesses = await prisma.business.findMany({
    where: { clientId },
    select: { id: true },
  });
  await Promise.all(businesses.map((b: { id: string }) => refreshBusinessInsight(b.id)));
}
