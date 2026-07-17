import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canAccess(session: any, clientId: string) {
  if (!session) return false;
  if (session.user.role === "ADMIN") return true;
  return session.user.id === clientId;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const item = await prisma.homeworkItem.findUnique({ where: { id: params.id } });
  if (!item || !canAccess(session, item.clientId)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { completed } = await req.json();

  const updated = await prisma.homeworkItem.update({
    where: { id: params.id },
    data: {
      completed: !!completed,
      completedAt: completed ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const item = await prisma.homeworkItem.findUnique({ where: { id: params.id } });
  if (!item || !canAccess(session, item.clientId)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.homeworkItem.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
