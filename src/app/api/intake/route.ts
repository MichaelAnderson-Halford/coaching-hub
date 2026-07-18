import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rateLimit";

function generatePassword(): string {
  return crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 10);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await checkRateLimit(`intake:${ip}`, 5, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many signups from this connection — please try again later." },
      { status: 429 }
    );
  }

  const { name, email, goals } = await req.json();

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "That email is already registered — try signing in instead." },
      { status: 409 }
    );
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const client = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "CLIENT",
    },
    select: { id: true, name: true, email: true },
  });

  await prisma.business.create({
    data: { clientId: client.id, name: `${name.trim()}'s Business` },
  });

  if (goals?.trim()) {
    const author = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (author) {
      await prisma.note.create({
        data: {
          clientId: client.id,
          authorId: author.id,
          content: `🎯 Goals from signup:\n\n${goals.trim()}`,
        },
      });
    }
  }

  // Email the client their login details, and let the coaches know someone
  // new signed up.
  const safeFirstName = escapeHtml(client.name.split(" ")[0]);
  await sendEmail({
    to: client.email,
    subject: "Welcome to Provider Pro Coaching Hub",
    html: `<p>Hi ${safeFirstName},</p><p>Your account is ready. Here's how to sign in:</p><p>Email: ${escapeHtml(client.email)}<br/>Password: <strong>${escapeHtml(password)}</strong></p><p>${escapeHtml(process.env.NEXTAUTH_URL || "")}</p>`,
  });

  const safeName = escapeHtml(client.name);
  const safeGoals = goals?.trim() ? escapeHtml(goals.trim()) : null;
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
  await Promise.all(
    admins.map((a: { email: string }) =>
      sendEmail({
        to: a.email,
        subject: `New client signed up: ${safeName}`,
        html: `<p><strong>${safeName}</strong> (${escapeHtml(client.email)}) just signed up through the intake form.</p>${
          safeGoals ? `<p>Their goals:</p><p style="padding:12px;background:#f5f5f7;border-radius:8px;">${safeGoals}</p>` : ""
        }<p><a href="${process.env.NEXTAUTH_URL || ""}/admin/${client.id}">View their profile</a></p>`,
      })
    )
  );

  return NextResponse.json({ email: client.email, password }, { status: 201 });
}
