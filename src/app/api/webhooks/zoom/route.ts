import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { refreshAllInsights } from "@/lib/insights";

function extractMeetingId(zoomLink: string | null): string | null {
  if (!zoomLink) return null;
  const match = zoomLink.match(/\/j\/(\d+)/);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

  if (!secretToken) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event === "endpoint.url_validation") {
    const plainToken = body.payload?.plainToken;
    const encryptedToken = crypto
      .createHmac("sha256", secretToken)
      .update(plainToken)
      .digest("hex");
    return NextResponse.json({ plainToken, encryptedToken });
  }

  const timestamp = req.headers.get("x-zm-request-timestamp");
  const signature = req.headers.get("x-zm-signature");
  const message = `v0:${timestamp}:${rawBody}`;
  const expected =
    "v0=" + crypto.createHmac("sha256", secretToken).update(message).digest("hex");

  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (body.event === "meeting.summary_completed") {
    const obj = body.payload?.object;

    if (obj) {
      const meetingId = String(obj.meeting_id || obj.id || "");
      // Zoom occasionally redelivers the same webhook event (e.g. if our
      // response is slow). Use the meeting ID + start time as a unique
      // key so a retried delivery never creates a duplicate call note.
      const startTime = String(obj.start_time || obj.uuid || "");

      try {
        await prisma.processedZoomSummary.create({
          data: { meetingId, startTime },
        });
      } catch {
        // Unique constraint violation means we've already processed this
        // exact meeting summary — safely stop here.
        return NextResponse.json({ received: true, duplicate: true });
      }

      const clients = await prisma.user.findMany({ where: { role: "CLIENT" } });
      const matched = clients.find(
        (c: { zoomLink: string | null }) => extractMeetingId(c.zoomLink) === meetingId
      );

      if (matched) {
        const author = await prisma.user.findFirst({ where: { role: "ADMIN", organizationId: matched.organizationId } });

        if (author) {
          const details = Array.isArray(obj.summary_details)
            ? obj.summary_details
                .map((d: any) => `• ${d.summary || d.label}`)
                .join("\n")
            : "";
          const nextSteps =
            Array.isArray(obj.next_steps) && obj.next_steps.length
              ? `\n\nNext steps:\n${obj.next_steps
                  .map((s: string) => `• ${s}`)
                  .join("\n")}`
              : "";
          const content = `🤖 Auto-added from Zoom AI summary\n\n${
            obj.summary_overview || ""
          }${details ? `\n\n${details}` : ""}${nextSteps}`;

          await prisma.note.create({
            data: {
              clientId: matched.id,
              authorId: author.id,
              content: content.trim(),
            },
          });

          await refreshAllInsights(matched.id);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
