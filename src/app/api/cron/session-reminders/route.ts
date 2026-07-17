import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSessionReminder } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      archivedAt: null,
      nextMeetingAt: { gte: now, lte: in24Hours },
    },
    select: { id: true, name: true, nextMeetingAt: true, zoomLink: true, reminderSentForMeetingAt: true },
  });

  let sent = 0;

  for (const client of clients) {
    if (!client.nextMeetingAt) continue;

    // Skip if we've already sent a reminder for this exact session time.
    if (
      client.reminderSentForMeetingAt &&
      client.reminderSentForMeetingAt.getTime() === client.nextMeetingAt.getTime()
    ) {
      continue;
    }

    await sendSessionReminder(client.id, client.name, client.nextMeetingAt, client.zoomLink);
    await prisma.user.update({
      where: { id: client.id },
      data: { reminderSentForMeetingAt: client.nextMeetingAt },
    });
    sent++;
  }

  return NextResponse.json({ checked: clients.length, sent });
}
