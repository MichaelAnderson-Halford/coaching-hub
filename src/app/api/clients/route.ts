import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const showArchived = req.nextUrl.searchParams.get("archived") === "true";

  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      archivedAt: showArchived ? { not: null } : null,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      nextMeetingAt: true,
      zoomLink: true,
      archivedAt: true,
    },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
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

  const passwordHash = await bcrypt.hash(password, 10);
  const client = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "CLIENT",
    },
    select: { id: true, name: true, email: true },
  });

  // Every client starts with one default business — the UI only shows a
  // switcher once a second one gets added.
  await prisma.business.create({
    data: { clientId: client.id, name: `${name}'s Business` },
  });

  await sendEmail({
    to: client.email,
    subject: "Welcome to Provider Pro Coaching Hub",
    html: `<p>Hi ${escapeHtml(name.split(" ")[0])},</p><p>Your coaching hub account is ready. Here's how to sign in:</p><p>Email: ${escapeHtml(client.email)}<br/>Password: <strong>${escapeHtml(password)}</strong></p><p><a href="${process.env.NEXTAUTH_URL || ""}">Sign in here</a></p>`,
  });

  return NextResponse.json(client, { status: 201 });
}
