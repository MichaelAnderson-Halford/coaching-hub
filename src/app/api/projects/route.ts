import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkOrgAccess } from "@/lib/access";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { businessId, name } = await req.json();

  if (!businessId || !name?.trim()) {
    return NextResponse.json({ error: "Missing businessId or name" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || !(await checkOrgAccess(session, business.clientId))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const project = await prisma.project.create({
    data: { businessId, name: name.trim() },
  });

  return NextResponse.json(project, { status: 201 });
}
