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
      organizationId: session.user.organizationId,
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

function welcomeEmailHtml(firstName: string, username: string, password: string) {
  const site = "www.thecoachinghub.providerpro.co.uk";
  const loginUrl = process.env.NEXTAUTH_URL || "";
  return `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>Big news — Michael has been quietly grinding away behind the scenes for weeks, building something truly next-level just for you, and today it finally launches: Coaching Hub is LIVE!</p>
    <p>This isn't just another login page — it's a whole new home for our work together. Built from scratch, designed with you in mind, and packed with everything you need to stay on track and crush your goals. We could not be more excited to hand you the keys.</p>
    <p><strong>Welcome aboard — your account is set up and ready to go!</strong></p>
    <p>Coaching Hub is your personal dashboard for everything happening in our work together — session details, homework and projects, and updates, all in one place.</p>

    <p><strong>Your Login Details</strong></p>
    <ul>
      <li>Website: ${escapeHtml(site)}</li>
      <li>Username: ${escapeHtml(username)}</li>
      <li>Temporary Password: <strong>${escapeHtml(password)}</strong></li>
    </ul>
    <p>For security, please log in and change your password as soon as possible.</p>

    <p><strong>Getting Started</strong></p>
    <ol>
      <li>Go to <a href="${loginUrl}">the link above</a> and sign in using the details above.</li>
      <li>Update your password on first login.</li>
      <li>Take a look around your dashboard to get familiar with your space.</li>
    </ol>

    <p><strong>How to Use Coaching Hub</strong></p>
    <ul>
      <li><strong>Dashboard:</strong> Your home base — a quick overview of your activity and what's coming up.</li>
      <li><strong>Projects:</strong> This is where your homework and action items live, grouped by project so it's easy to track what belongs to what. If you're working across more than one area with us, you'll see a dropdown to switch between them.</li>
      <li><strong>Sessions:</strong> Details on your upcoming coaching calls, including Zoom links, will show up here.</li>
      <li><strong>Notifications:</strong> You'll get email updates for key activity (like new homework or session reminders) sent to the address on file — no need to keep checking back manually.</li>
    </ul>

    <p>If anything looks off or you have questions getting started, just reply to this email and we'll sort it out.</p>
    <p>Welcome to the future of our coaching journey together!</p>
    <p>Warm regards,<br/>Michael Anderson-Halford<br/>Provider Pro / Coaching Hub</p>
  `;
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
      organizationId: session.user.organizationId,
    },
    select: { id: true, name: true, email: true },
  });

  await prisma.business.create({
    data: { clientId: client.id, name: `${name}'s Business` },
  });

  await sendEmail({
    to: client.email,
    subject: "It's Here — Welcome to Coaching Hub!",
    html: welcomeEmailHtml(name.split(" ")[0], client.email, password),
  });

  return NextResponse.json(client, { status: 201 });
}
