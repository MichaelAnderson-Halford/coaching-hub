import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(
    settings || {
      heroHeadline: null,
      heroSubheadline: null,
      aboutText: null,
      contactEmail: null,
      contactPhone: null,
    }
  );
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const data: {
    heroHeadline?: string;
    heroSubheadline?: string;
    aboutText?: string;
    contactEmail?: string;
    contactPhone?: string;
  } = {};

  if (typeof body.heroHeadline === "string") data.heroHeadline = body.heroHeadline;
  if (typeof body.heroSubheadline === "string") data.heroSubheadline = body.heroSubheadline;
  if (typeof body.aboutText === "string") data.aboutText = body.aboutText;
  if (typeof body.contactEmail === "string") data.contactEmail = body.contactEmail;
  if (typeof body.contactPhone === "string") data.contactPhone = body.contactPhone;

  const updated = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  return NextResponse.json(updated);
}
