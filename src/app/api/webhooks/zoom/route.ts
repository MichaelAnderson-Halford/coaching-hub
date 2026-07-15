import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Zoom meeting links look like https://zoom.us/j/1234567890 — pull the
// numeric meeting ID out so we can match it against the webhook payload.
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

  // Zoom's one-time endpoint validation handshake when you first add the
  // webhook URL in the Zoom App dashboard.
  if (body.event === "endpoint.url_validation") {
    const plainToken = body.payload?.plainToken;
    const encryptedToken = crypto
      .createHmac("sha256", secretToken)
      .update(plainToken)
      .digest("hex");
    return NextResponse.json({ plainToken, encryptedToken });
  }

  // Verify this request genuinely came from Zoom before trusting it.
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
      const clients = await prisma.user.findMany({ where: { role: "CLIENT" } });
      const matched = clients.find(
        (c: { zoomLink: string | null }) => extractMeetingId(c.zoomLink) === meetingId
      );

      if (matched) {
        const author = await prisma.user.findFirst({ where: { role: "ADMIN" } });

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
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
