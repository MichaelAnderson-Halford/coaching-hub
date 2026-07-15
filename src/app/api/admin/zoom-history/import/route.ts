import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getZoomAccessToken } from "@/lib/zoom";

function encodeUuid(uuid: string): string {
  return encodeURIComponent(encodeURIComponent(uuid));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { uuid, clientId, startTime } = await req.json();
  if (!uuid || !clientId) {
    return NextResponse.json({ error: "Missing uuid or clientId" }, { status: 400 });
  }

  const marker = `[[zoom:${uuid}]]`;

  // Check across every client's notes, not just this one — a call could
  // theoretically get imported to the wrong client and re-tried elsewhere.
  const alreadyImported = await prisma.note.findFirst({
    where: { content: { contains: marker } },
  });
  if (alreadyImported) {
    return NextResponse.json({ error: "This call has already been imported" }, { status: 409 });
  }

  let accessToken: string;
  try {
    accessToken = await getZoomAccessToken();
  } catch {
    return NextResponse.json({ error: "Could not authenticate with Zoom" }, { status: 500 });
  }

  const summaryRes = await fetch(
    `https://api.zoom.us/v2/meetings/${encodeUuid(uuid)}/meeting_summary`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!summaryRes.ok) {
    return NextResponse.json({ error: "No AI summary found for that call" }, { status: 404 });
  }

  const summary = await summaryRes.json();
  const details = Array.isArray(summary.summary_details)
    ? summary.summary_details.map((d: any) => `• ${d.summary || d.label}`).join("\n")
    : "";
  const nextSteps =
    Array.isArray(summary.next_steps) && summary.next_steps.length
      ? `\n\nNext steps:\n${summary.next_steps.map((s: string) => `• ${s}`).join("\n")}`
      : "";

  const dateLabel = startTime ? new Date(startTime).toLocaleDateString() : "";

  const content = `🤖 Imported from Zoom AI summary (${dateLabel})\n\n${
    summary.summary_overview || ""
  }${details ? `\n\n${details}` : ""}${nextSteps}\n\n${marker}`;

  const note = await prisma.note.create({
    data: {
      clientId,
      authorId: session.user.id,
      content: content.trim(),
    },
  });

  return NextResponse.json(note, { status: 201 });
}
