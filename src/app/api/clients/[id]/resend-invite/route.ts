import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/sanitize";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const client = await prisma.user.findUnique({
    where: { id: params.id, role: "CLIENT" },
    select: { id: true, name: true, email: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.passwordResetToken.create({
    data: { token, expiresAt, userId: client.id },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL || ""}/reset-password/${token}`;
  const firstName = client.name.split(" ")[0];

  await sendEmail({
    to: client.email,
    subject: "Set up your Coaching Hub password",
    html: `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Here's a fresh link to sign in to your Coaching Hub account. Click below to set your password:</p>
      <p><a href="${resetUrl}">Set your password</a></p>
      <p>This link expires in 1 hour. If you didn't expect this, you can ignore it.</p>
      <p>Warm regards,<br/>Michael Anderson-Halford<br/>Provider Pro / Coaching Hub</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
