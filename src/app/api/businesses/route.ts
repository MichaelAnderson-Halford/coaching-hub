import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { clientId, name } = await req.json();
  if (!clientId || !name?.trim()) {
    return NextResponse.json({ error: "Missing clientId or name" }, { status: 400 });
  }

  const business = await prisma.business.create({
    data: { clientId, name: name.trim() },
    include: { metrics: { include: { entries: true } } },
  });

  return NextResponse.json(business, { status: 201 });
}
