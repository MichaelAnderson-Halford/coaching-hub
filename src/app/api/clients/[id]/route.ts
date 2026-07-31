import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAllInsights } from "@/lib/insights";
import { checkOrgAccess } from "@/lib/access";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(await checkOrgAccess(session, params.id))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const isAdminViewing = session?.user.role === "ADMIN";

  const client = await prisma.user.findUnique({
    where: { id: params.id, role: "CLIENT" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      nextMeetingAt: true,
      zoomLink: true,
      zoomPassword: true,
      zoomMeetingId: true,
      archivedAt: true,
      ninetyDayPlan: true,
      clientMessage: true,
      clientMessageUpdatedAt: true,
      notesAsClient: {
        where: isAdminViewing ? {} : { isPrivate: false },
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      threadMessages: {
        orderBy: { createdAt: "desc" },
        select: { id: true, content: true, createdAt: true, readByCoach: true, senderId: true },
      },
      clientAccount: {
        select: {
          wins: { orderBy: { createdAt: "desc" } },
          resources: { orderBy: { createdAt: "desc" } },
          homeworkItems: { orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }] },
          sessions: { orderBy: { sessionNumber: "desc" } },
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
              projects: {
                orderBy: { createdAt: "asc" },
                select: { id: true, name: true },
              },
            },
          },
          plan: { select: { id: true } },
        },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Flatten clientAccount's fields onto the response so the frontend
  // shape stays exactly the same as before this migration — no page
  // changes needed tonight.
  const { clientAccount, ...rest } = client;
  const flattened = {
    ...rest,
    wins: clientAccount?.wins || [],
    resources: clientAccount?.resources || [],
    homeworkItems: clientAccount?.homeworkItems || [],
    sessions: clientAccount?.sessions || [],
    businesses: clientAccount?.businesses || [],
    plan: clientAccount?.plan || null,
  };

  return NextResponse.json(flattened);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!(await checkOrgAccess(session, params.id))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();

  if (body.markMessagesRead === true) {
    await prisma.message.updateMany({
      where: { clientId: params.id, readByCoach: false },
      data: { readByCoach: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (typeof body.name === "string" || typeof body.email === "string") {
    const data: { name?: string; email?: string } = {};

    if (typeof body.name === "string") {
      if (!body.name.trim()) {
        return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
      }
      data.name = body.name.trim();
    }

    if (typeof body.email === "string") {
      const normalizedEmail = body.email.toLowerCase().trim();
      if (!normalizedEmail) {
        return NextResponse.json({ error: "Email can't be empty" }, { status: 400 });
      }
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing && existing.id !== params.id) {
        return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
      }
      data.email = normalizedEmail;
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(updated);
  }

  const data: {
    zoomLink?: string;
    zoomPassword?: string;
    zoomMeetingId?: string;
    nextMeetingAt?: Date | null;
    archivedAt?: Date | null;
    ninetyDayPlan?: string;
  } = {};
  if (typeof body.zoomLink === "string") data.zoomLink = body.zoomLink;
  if (typeof body.zoomPassword === "string") data.zoomPassword = body.zoomPassword;
  if (typeof body.zoomMeetingId === "string") data.zoomMeetingId = body.zoomMeetingId;
  if (body.nextMeetingAt === null) data.nextMeetingAt = null;
  else if (typeof body.nextMeetingAt === "string") data.nextMeetingAt = new Date(body.nextMeetingAt);
  if (typeof body.archived === "boolean") {
    data.archivedAt = body.archived ? new Date() : null;
  }
  if (typeof body.ninetyDayPlan === "string") data.ninetyDayPlan = body.ninetyDayPlan;

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, zoomLink: true, zoomPassword: true, zoomMeetingId: true, nextMeetingAt: true, archivedAt: true, ninetyDayPlan: true },
  });

  if (typeof body.ninetyDayPlan === "string") {
    refreshAllInsights(params.id).catch(() => {});
  }

  return NextResponse.json(updated);
}
