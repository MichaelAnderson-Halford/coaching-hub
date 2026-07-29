import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkBusinessOrgAccess } from "@/lib/access";

async function getProjectAndCheckAccess(session: any, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { business: true },
  });
  if (!project) return null;
  const allowed = await checkBusinessOrgAccess(session, project.businessId);
  return allowed ? project : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  const project = await getProjectAndCheckAccess(session, params.projectId);
  if (!project) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const data: { name?: string } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();

  const updated = await prisma.project.update({
    where: { id: params.projectId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  const project = await getProjectAndCheckAccess(session, params.projectId);
  if (!project) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: params.projectId } });
  return NextResponse.json({ deleted: true });
}
