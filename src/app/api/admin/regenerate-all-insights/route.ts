import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshBusinessInsight } from "@/lib/insights";

// Temporary one-off endpoint to regenerate every business's AI Briefing
// under the new factual-summary prompt. Safe to delete after running once.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const businesses = await prisma.business.findMany({ select: { id: true, name: true } });

  let done = 0;
  for (const b of businesses) {
    await refreshBusinessInsight(b.id);
    done++;
  }

  return NextResponse.json({ refreshed: done });
}
