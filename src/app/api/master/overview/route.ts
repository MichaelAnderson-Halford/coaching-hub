import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_PRICES: Record<string, number> = {
  starter: 29,
  growth: 59,
  scale: 99,
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      createdAt: true,
      users: {
        where: { role: "CLIENT" },
        select: {
          id: true,
          clientAccount: {
            select: {
              sessions: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
            },
          },
        },
      },
    },
  });

  const rows = orgs.map((org: any) => {
    const clientCount = org.users.length;
    const lastSessionDates = org.users
      .flatMap((u: any) => (u.clientAccount?.sessions || []).map((s: any) => s.date))
      .filter(Boolean);
    const lastActivityAt =
      lastSessionDates.length > 0
        ? new Date(Math.max(...lastSessionDates.map((d: Date) => new Date(d).getTime())))
        : null;

    // Revenue is approximate: we don't yet store which specific tier a
    // paid org is on, only that they're "paid" — once tier tracking is
    // added to Organization, this can become exact rather than an estimate.
    const mrr = org.plan === "paid" ? PLAN_PRICES.starter : 0;

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      subscriptionStatus: org.subscriptionStatus,
      trialEndsAt: org.trialEndsAt,
      createdAt: org.createdAt,
      clientCount,
      lastActivityAt,
      mrr,
    };
  });

  const totalMrr = rows.reduce((sum: number, r: any) => sum + r.mrr, 0);
  const totalClients = rows.reduce((sum: number, r: any) => sum + r.clientCount, 0);

  return NextResponse.json({ organizations: rows, totalMrr, totalClients });
}
