import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const allowed = await checkRateLimit(`forgot-password:${normalizedEmail}`, 5, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests — please try again later." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Always respond the same way whether or not the email exists — this
  // prevents using this form to check which emails are registered.
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, expiresAt, userId: user.id },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || ""}/reset-password/${token}`;
    const firstName = user.name.split(" ")[0];

    await sendEmail({
      to: user.email,
      subject: "Reset your Coaching Hub password",
      html: `
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>We got a request to reset your Coaching Hub password. Click below to set a new one:</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
