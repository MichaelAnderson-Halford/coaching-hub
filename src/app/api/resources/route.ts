import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { clientId, title, url, description } = await req.json();
  if (!clientId || !title?.trim()) {
    return NextResponse.json({ error: "Missing clientId or title" }, { status: 400 });
  }

  const resource = await prisma.resource.create({
    data: {
      clientId,
      title: title.trim(),
      url: url?.trim() || null,
      description: description?.trim() || null,
    },
  });

  return NextResponse.json(resource, { status: 201 });
}
