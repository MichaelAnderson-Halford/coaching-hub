import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewMessage } from "@/lib/notify";

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

  const messages = await prisma.message.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true, role: true } } },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { clientId, content } = await req.json();

  if (!clientId || !content?.trim() || !canAccess(session, clientId)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: { clientId, senderId: session!.user.id, content: content.trim() },
    include: { sender: { select: { name: true, role: true } } },
  });

  await notifyNewMessage(
    clientId,
    session!.user.id,
    message.sender.name,
    message.sender.role === "CLIENT",
    content.trim()
  );

  return NextResponse.json(message, { status: 201 });
}
