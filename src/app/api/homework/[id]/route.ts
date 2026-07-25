import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkOrgAccess } from "@/lib/access";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const item = await prisma.homeworkItem.findUnique({ where: { id: params.id } });
  if (!item || !(await checkOrgAccess(session, item.clientId))) {
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
  if (!item || !(await checkOrgAccess(session, item.clientId))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.homeworkItem.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
