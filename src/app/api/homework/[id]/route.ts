import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkItemAccess(session: any, itemId: string) {
  if (!session?.user) return null;

  const item = await prisma.homeworkItem.findUnique({
    where: { id: itemId },
    include: {
      clientAccount: {
        select: { organizationId: true, owners: { select: { id: true } } },
      },
    },
  });
  if (!item || !item.clientAccount) return null;
  if (item.clientAccount.organizationId !== session.user.organizationId) return null;

  if (session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") return item;

  const isOwner = item.clientAccount.owners.some((o: { id: string }) => o.id === session.user.id);
  return isOwner ? item : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const item = await checkItemAccess(session, params.id);
  if (!item) {
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
  const item = await checkItemAccess(session, params.id);
  if (!item) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.homeworkItem.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
