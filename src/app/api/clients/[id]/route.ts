import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      ninetyDayPlan: true,
      notesAsClient: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      wins: { orderBy: { createdAt: "desc" } },
      resources: { orderBy: { createdAt: "desc" } },
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
  const data: { zoomLink?: string; nextMeetingAt?: Date | null; ninetyDayPlan?: string } = {};
  if (typeof body.zoomLink === "string") data.zoomLink = body.zoomLink;
  if (body.nextMeetingAt === null) data.nextMeetingAt = null;
  else if (typeof body.nextMeetingAt === "string") data.nextMeetingAt = new Date(body.nextMeetingAt);
  if (typeof body.ninetyDayPlan === "string") data.ninetyDayPlan = body.ninetyDayPlan;

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, zoomLink: true, nextMeetingAt: true, ninetyDayPlan: true },
  });

  return NextResponse.json(updated);
}
