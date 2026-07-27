import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

const TRIAL_DAYS = 14;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await checkRateLimit(`signup:${ip}`, 5, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many signups from this connection — please try again later." },
      { status: 429 }
    );
  }

  const { companyName, adminName, email, password } = await req.json();

  if (!companyName?.trim() || !adminName?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "That email is already registered — try signing in instead." },
      { status: 409 }
    );
  }

  const baseSlug = slugify(companyName);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const org = await prisma.organization.create({
    data: {
      name: companyName.trim(),
      slug,
      plan: "trial",
      trialEndsAt,
      subscriptionStatus: "trialing",
    },
  });

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: {
      name: adminName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "ADMIN",
      organizationId: org.id,
    },
    select: { id: true, name: true, email: true },
  });

  // Fire-and-forget: don't make the person wait on DNS/Vercel API calls
  // to finish signing up. If this fails, a superadmin can always add the
  // subdomain manually as a fallback.

  return NextResponse.json(
    { organization: { id: org.id, slug: org.slug }, admin },
    { status: 201 }
  );
}
