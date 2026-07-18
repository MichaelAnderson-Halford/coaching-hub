import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canAccess(session: any, clientId: string) {
  if (!session) return false;
  if (session.user.role === "ADMIN") return true;
  return session.user.id === clientId;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!canAccess(session, params.id)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const plan = await prisma.plan.findUnique({
    where: { clientId: params.id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          projects: { orderBy: { order: "asc" } },
          kpis: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  return NextResponse.json(plan);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const { quarterLabel, startDate, endDate, advisorName, sections } = body;

  if (!quarterLabel?.trim() || !Array.isArray(sections)) {
    return NextResponse.json({ error: "Missing quarterLabel or sections" }, { status: 400 });
  }

  // Simplest reliable approach for deeply nested data: replace the whole
  // document in one transaction rather than diffing individual items.
  const plan = await prisma.$transaction(async (tx: any) => {
    await tx.plan.deleteMany({ where: { clientId: params.id } });

    return tx.plan.create({
      data: {
        clientId: params.id,
        quarterLabel: quarterLabel.trim(),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        advisorName: advisorName?.trim() || null,
        sections: {
          create: sections.map((s: any, sIdx: number) => ({
            businessName: s.businessName?.trim() || "",
            theme: s.theme?.trim() || null,
            themeDescription: s.themeDescription?.trim() || null,
            recommendations: s.recommendations?.trim() || null,
            order: sIdx,
            projects: {
              create: (s.projects || []).map((p: any, pIdx: number) => ({
                name: p.name?.trim() || "",
                outcome: p.outcome?.trim() || "",
                keyApproach: p.keyApproach?.trim() || "",
                measures: p.measures?.trim() || "",
                month1Label: p.month1Label?.trim() || null,
                month2Label: p.month2Label?.trim() || null,
                month3Label: p.month3Label?.trim() || null,
                order: pIdx,
              })),
            },
            kpis: {
              create: (s.kpis || []).map((k: any, kIdx: number) => ({
                name: k.name?.trim() || "",
                value: k.value?.trim() || null,
                order: kIdx,
              })),
            },
          })),
        },
      },
      include: {
        sections: {
          include: { projects: true, kpis: true },
        },
      },
    });
  });

  return NextResponse.json(plan);
}
