import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getZoomAccessToken } from "@/lib/zoom";
import { refreshAllInsights } from "@/lib/insights";

function extractMeetingId(zoomLink: string | null): string | null {
  if (!zoomLink) return null;
  const match = zoomLink.match(/\/j\/(\d+)/);
  return match ? match[1] : null;
}

// Zoom meeting UUIDs sometimes contain "/" or start with "/", which breaks
// URLs unless double-encoded. See Zoom's API docs for why this is needed.
function encodeUuid(uuid: string): string {
  return encodeURIComponent(encodeURIComponent(uuid));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const client = await prisma.user.findUnique({ where: { id: params.id } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const meetingId = extractMeetingId(client.zoomLink);
    if (!meetingId) {
      return NextResponse.json(
        { error: "No Zoom meeting ID detected for this client" },
        { status: 400 }
      );
    }

    let accessToken: string;
    try {
      accessToken = await getZoomAccessToken();
    } catch (e: any) {
      return NextResponse.json({ error: `Zoom auth failed: ${e.message}` }, { status: 500 });
    }

    // Get every past instance of this recurring meeting Zoom still has on file.
    const instancesRes = await fetch(
      `https://api.zoom.us/v2/past_meetings/${meetingId}/instances`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!instancesRes.ok) {
      const body = await instancesRes.text();
      return NextResponse.json(
        { error: `Could not fetch past meeting instances from Zoom (${instancesRes.status}): ${body}` },
        { status: 502 }
      );
    }

    const instancesData = await instancesRes.json();
    const instances: { uuid: string; start_time: string }[] = instancesData.meetings || [];

    const author = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!author) {
      return NextResponse.json({ error: "No coach account found to attribute notes to" }, { status: 500 });
    }

    const existingNotes = await prisma.note.findMany({
      where: { clientId: client.id },
      select: { content: true },
    });

    let imported = 0;
    let skipped = 0;

    for (const instance of instances) {
      // Skip anything we've already imported before (marked by a hidden tag).
      const marker = `[[zoom:${instance.uuid}]]`;
      if (existingNotes.some((n: { content: string }) => n.content.includes(marker))) {
        skipped++;
        continue;
      }

      const summaryRes = await fetch(
        `https://api.zoom.us/v2/meetings/${encodeUuid(instance.uuid)}/meeting_summary`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!summaryRes.ok) {
        // No AI summary exists for this particular past call — that's fine.
        continue;
      }

      const summary = await summaryRes.json();
      const details = Array.isArray(summary.summary_details)
        ? summary.summary_details.map((d: any) => `• ${d.summary || d.label}`).join("\n")
        : "";
      const nextSteps =
        Array.isArray(summary.next_steps) && summary.next_steps.length
          ? `\n\nNext steps:\n${summary.next_steps.map((s: string) => `• ${s}`).join("\n")}`
          : "";

      const dateLabel = instance.start_time
        ? new Date(instance.start_time).toLocaleDateString()
        : "";

      const content = `🤖 Imported from Zoom AI summary (${dateLabel})\n\n${
        summary.summary_overview || ""
      }${details ? `\n\n${details}` : ""}${nextSteps}\n\n${marker}`;

      await prisma.note.create({
        data: {
          clientId: client.id,
          authorId: author.id,
          content: content.trim(),
        },
      });
      imported++;
    }

    if (imported > 0) {
      await refreshAllInsights(client.id);
    }

    return NextResponse.json({ imported, skipped, totalInstancesChecked: instances.length });
  } catch (e: any) {
    return NextResponse.json({ error: `Unexpected error: ${e.message}` }, { status: 500 });
  }
}
