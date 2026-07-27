import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLimitsForOrg } from "@/lib/planLimits";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing name, email, or password" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
  }

  const org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });
  if (org) {
    const { maxCoaches } = getLimitsForOrg(org);
    if (maxCoaches !== Infinity) {
      const coachCount = await prisma.user.count({
        where: { role: "ADMIN", organizationId: org.id },
      });
      if (coachCount >= maxCoaches) {
        return NextResponse.json(
          { error: `Your plan allows up to ${maxCoaches} coach seat(s). Upgrade to add more.` },
          { status: 403 }
        );
      }
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "ADMIN",
      organizationId: session.user.organizationId,
    },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(admin, { status: 201 });
}
