import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkBusinessOrgAccess } from "@/lib/access";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  if (!(await checkBusinessOrgAccess(session, businessId))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const metrics = await prisma.metric.findMany({
    where: { businessId },
    orderBy: { createdAt: "asc" },
    include: { entries: { orderBy: { recordedAt: "asc" } } },
  });

  return NextResponse.json(metrics);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { businessId, name, unit, target } = await req.json();

  if (!businessId || !name?.trim()) {
    return NextResponse.json({ error: "Missing businessId or name" }, { status: 400 });
  }

  if (!(await checkBusinessOrgAccess(session, businessId))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const metric = await prisma.metric.create({
    data: {
      businessId,
      name: name.trim(),
      unit: unit?.trim() || null,
      target: target === "" || target === undefined || target === null ? null : Number(target),
    },
    include: { entries: true },
  });

  return NextResponse.json(metric, { status: 201 });
}
