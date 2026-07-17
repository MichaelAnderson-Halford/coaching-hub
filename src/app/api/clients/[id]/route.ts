import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAllBusinessInsights } from "@/lib/insights";

function canAccess(session: any, clientId: string) {
  if (!session) return false;
  if (session.user.role === "ADMIN") return true;
  return session.user.id === clientId;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!canAccess(session, params.id)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const client = await prisma.user.findUnique({
    where: { id: params.id, role: "CLIENT" },
    select: {
      id: true,
      name: true,
      email: true,
      nextMeetingAt: true,
      zoomLink: true,
      archivedAt: true,
      ninetyDayPlan: true,
      notesAsClient: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      wins: { orderBy: { createdAt: "desc" } },
      resources: { orderBy: { createdAt: "desc" } },
      homeworkItems: { orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }] },
      businesses: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          insight: true,
          insightUpdatedAt: true,
          metrics: {
            orderBy: { createdAt: "asc" },
            include: { entries: { orderBy: { recordedAt: "asc" } } },
          },
        },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const data: {
    zoomLink?: string;
    nextMeetingAt?: Date | null;
    archivedAt?: Date | null;
    ninetyDayPlan?: string;
  } = {};
  if (typeof body.zoomLink === "string") data.zoomLink = body.zoomLink;
  if (body.nextMeetingAt === null) data.nextMeetingAt = null;
  else if (typeof body.nextMeetingAt === "string") data.nextMeetingAt = new Date(body.nextMeetingAt);
  if (typeof body.archived === "boolean") {
    data.archivedAt = body.archived ? new Date() : null;
  }
  if (typeof body.ninetyDayPlan === "string") data.ninetyDayPlan = body.ninetyDayPlan;

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, zoomLink: true, nextMeetingAt: true, archivedAt: true, ninetyDayPlan: true },
  });

  if (typeof body.ninetyDayPlan === "string") {
    await refreshAllBusinessInsights(params.id);
  }

  return NextResponse.json(updated);
}
