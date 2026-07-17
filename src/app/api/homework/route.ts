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
  const { clientId, title, dueDate, items } = await req.json();

  if (!clientId || !canAccess(session, clientId)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Bulk mode: an array of plain title strings, e.g. pasted from Zoom notes.
  if (Array.isArray(items)) {
    const titles = items.map((t: string) => t.trim()).filter(Boolean);
    if (titles.length === 0) {
      return NextResponse.json({ error: "No items to add" }, { status: 400 });
    }
    await prisma.homeworkItem.createMany({
      data: titles.map((t: string) => ({ clientId, title: t })),
    });
    return NextResponse.json({ created: titles.length }, { status: 201 });
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
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
