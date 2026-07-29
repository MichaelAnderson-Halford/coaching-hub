import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkBusinessAccess(session: any, businessId: string) {
  if (!session?.user) return null;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      clientAccount: {
        select: { organizationId: true, owners: { select: { id: true } } },
      },
    },
  });
  if (!business || !business.clientAccount) return null;
  if (business.clientAccount.organizationId !== session.user.organizationId) return null;

  if (session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") return business;

  const isOwner = business.clientAccount.owners.some((o: { id: string }) => o.id === session.user.id);
  return isOwner ? business : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const session = await getServerSession(authOptions);
  const business = await checkBusinessAccess(session, params.businessId);
  if (!business) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const data: { name?: string } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();

  const updated = await prisma.business.update({
    where: { id: params.businessId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const business = await checkBusinessAccess(session, params.businessId);
  if (!business) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const count = await prisma.business.count({ where: { clientAccountId: business.clientAccountId } });
  if (count <= 1) {
    return NextResponse.json(
      { error: "Can't delete a client's only business — they need at least one." },
      { status: 400 }
    );
  }

  await prisma.business.delete({ where: { id: params.businessId } });
  return NextResponse.json({ deleted: true });
}
