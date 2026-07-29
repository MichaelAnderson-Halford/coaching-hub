import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkBusinessOrgAccess } from "@/lib/access";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { businessId, name } = await req.json();

  if (!businessId || !name?.trim()) {
    return NextResponse.json({ error: "Missing businessId or name" }, { status: 400 });
  }

  if (!(await checkBusinessOrgAccess(session, businessId))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const project = await prisma.project.create({
    data: { businessId, name: name.trim() },
  });

  return NextResponse.json(project, { status: 201 });
}
