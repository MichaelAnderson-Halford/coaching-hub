import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshAllInsights } from "@/lib/insights";
import { notifyNewWin } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { clientId, content } = await req.json();
  if (!clientId || !content?.trim()) {
    return NextResponse.json({ error: "Missing clientId or content" }, { status: 400 });
  }

  const win = await prisma.win.create({
    data: { clientId, content: content.trim() },
  });

  await refreshAllInsights(clientId);
  await notifyNewWin(clientId, session.user.id, content.trim());

  return NextResponse.json(win, { status: 201 });
}
