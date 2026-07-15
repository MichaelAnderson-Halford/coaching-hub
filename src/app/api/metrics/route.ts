import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canAccess(session: any, clientId: string) {
  if (!session) return false;
  if (session.user.role === "ADMIN") return true;
  return session.user.id === clientId;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId || !canAccess(session, clientId)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const metrics = await prisma.metric.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
    include: { entries: { orderBy: { recordedAt: "asc" } } },
  });

  return NextResponse.json(metrics);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { clientId, name, unit, target } = await req.json();

  if (!clientId || !name?.trim() || !canAccess(session, clientId)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const metric = await prisma.metric.create({
    data: {
      clientId,
      name: name.trim(),
      unit: unit?.trim() || null,
      target: target === "" || target === undefined || target === null ? null : Number(target),
    },
    include: { entries: true },
  });

  return NextResponse.json(metric, { status: 201 });
}
