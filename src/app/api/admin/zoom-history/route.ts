import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getZoomAccessToken } from "@/lib/zoom";

function encodeUuid(uuid: string): string {
  return encodeURIComponent(encodeURIComponent(uuid));
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const meetingId = req.nextUrl.searchParams.get("meetingId");
  if (!meetingId) {
    return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getZoomAccessToken();
  } catch (e: any) {
    return NextResponse.json({ error: `Zoom auth failed: ${e.message}` }, { status: 500 });
  }

  const instancesRes = await fetch(
    `https://api.zoom.us/v2/past_meetings/${meetingId}/instances`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!instancesRes.ok) {
    return NextResponse.json(
      { error: "Could not fetch past meeting instances from Zoom" },
      { status: 502 }
    );
  }

  const instancesData = await instancesRes.json();
  const instances: { uuid: string; start_time: string }[] = instancesData.meetings || [];

  const calls = await Promise.all(
    instances.map(async (instance) => {
      const [participantsRes, summaryRes] = await Promise.all([
        fetch(`https://api.zoom.us/v2/past_meetings/${encodeUuid(instance.uuid)}/participants`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`https://api.zoom.us/v2/meetings/${encodeUuid(instance.uuid)}/meeting_summary`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      let participants: { name: string; user_email: string }[] = [];
      if (participantsRes.ok) {
        const data = await participantsRes.json();
        participants = data.participants || [];
      }

      return {
        uuid: instance.uuid,
        startTime: instance.start_time,
        hasSummary: summaryRes.ok,
        participants: participants.map((p) => ({ name: p.name, email: p.user_email || null })),
      };
    })
  );

  calls.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return NextResponse.json({ calls });
}
