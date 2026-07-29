import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshBusinessInsight, refreshClientMessage } from "@/lib/insights";
import { checkBusinessOrgAccess } from "@/lib/access";

export async function POST(
  req: NextRequest,
  { params }: { params: { metricId: string } }
) {
  const session = await getServerSession(authOptions);

  const metric = await prisma.metric.findUnique({ where: { id: params.metricId } });
  if (!metric) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (!(await checkBusinessOrgAccess(session, metric.businessId))) {
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

  await refreshBusinessInsight(metric.businessId);

  const business = await prisma.business.findUnique({
    where: { id: metric.businessId },
    select: { clientAccount: { select: { owners: { select: { id: true }, take: 1 } } } },
  });
  const ownerId = business?.clientAccount?.owners?.[0]?.id;
  if (ownerId) {
    await refreshClientMessage(ownerId);
  }

  return NextResponse.json(entry, { status: 201 });
}
