import { prisma } from "./prisma";

// Returns true if the action is allowed, false if the key has already hit
// the limit within the time window. Records this attempt either way, so
// repeated blocked attempts keep extending the "recent activity" picture
// rather than resetting it.
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<boolean> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const recentCount = await prisma.rateLimitEvent.count({
      where: { key, createdAt: { gte: windowStart } },
    });

    await prisma.rateLimitEvent.create({ data: { key } });

    // Best-effort cleanup so this table doesn't grow forever — only runs
    // occasionally to keep the extra query cheap.
    if (Math.random() < 0.02) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      prisma.rateLimitEvent.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => {});
    }

    return recentCount < maxAttempts;
  } catch {
    // If rate limiting itself fails, don't let that block the real action.
    return true;
  }
}
