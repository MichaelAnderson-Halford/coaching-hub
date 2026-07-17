import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canAccess(session: any, clientId: string) {
  if (!session) return false;
  if (session.user.role === "ADMIN") return true;
  return session.user.id === clientId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const session = await getServerSession(authOptions);

  const business = await prisma.business.findUnique({ where: { id: params.businessId } });
  if (!business || !canAccess(session, business.clientId)) {
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
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const business = await prisma.business.findUnique({ where: { id: params.businessId } });
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const count = await prisma.business.count({ where: { clientId: business.clientId } });
  if (count <= 1) {
    return NextResponse.json(
      { error: "Can't delete a client's only business — they need at least one." },
      { status: 400 }
    );
  }

  await prisma.business.delete({ where: { id: params.businessId } });
  return NextResponse.json({ deleted: true });
}
