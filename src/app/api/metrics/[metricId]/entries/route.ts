import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshClientInsight } from "@/lib/insights";

function canAccess(session: any, clientId: string) {
  if (!session) return false;
  if (session.user.role === "ADMIN") return true;
  return session.user.id === clientId;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { metricId: string } }
) {
  const session = await getServerSession(authOptions);

  const metric = await prisma.metric.findUnique({ where: { id: params.metricId } });
  if (!metric || !canAccess(session, metric.clientId)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { value, recordedAt } = await req.json();
  if (typeof value !== "number" || Number.isNaN(value)) {
    return NextResponse.json({ error: "Missing or invalid value" }, { status: 400 });
  }

  const entry = await prisma.metricEntry.create({
    data: {
      metricId: params.metricId,
      value,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    },
  });

  await refreshClientInsight(metric.clientId);

  return NextResponse.json(entry, { status: 201 });
}
