import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { clientId, date, durationMinutes, summary } = await req.json();
  if (!clientId || !summary?.trim()) {
    return NextResponse.json({ error: "Missing clientId or summary" }, { status: 400 });
  }

  const count = await prisma.session.count({ where: { clientId } });

  const created = await prisma.session.create({
    data: {
      clientId,
      sessionNumber: count + 1,
      date: date ? new Date(date) : new Date(),
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      summary: summary.trim(),
    },
  });

  return NextResponse.json(created, { status: 201 });
}
