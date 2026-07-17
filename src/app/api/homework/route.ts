import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canAccess(session: any, clientId: string) {
  if (!session) return false;
  if (session.user.role === "ADMIN") return true;
  return session.user.id === clientId;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { clientId, title, dueDate } = await req.json();

  if (!clientId || !title?.trim() || !canAccess(session, clientId)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const item = await prisma.homeworkItem.create({
    data: {
      clientId,
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
