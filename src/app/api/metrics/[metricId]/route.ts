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
  { params }: { params: { metricId: string } }
) {
  const session = await getServerSession(authOptions);

  const metric = await prisma.metric.findUnique({ where: { id: params.metricId } });
  if (!metric || !canAccess(session, metric.clientId)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { target } = await req.json();

  const updated = await prisma.metric.update({
    where: { id: params.metricId },
    data: { target: target === "" || target === undefined || target === null ? null : Number(target) },
  });

  return NextResponse.json(updated);
}
