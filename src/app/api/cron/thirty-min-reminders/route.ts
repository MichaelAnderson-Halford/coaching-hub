import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSessionReminder } from "@/lib/notify";

// This route is triggered by an external scheduler (cron-job.org) every
// 5 minutes, since Vercel's Hobby plan only allows once-per-day cron
// jobs. It looks for sessions starting in the next 30 minutes that
// haven't had this specific reminder sent yet.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const now = new Date();
  const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);

  const clients = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      archivedAt: null,
      nextMeetingAt: { gte: now, lte: in30Minutes },
    },
    select: {
      id: true,
      name: true,
      nextMeetingAt: true,
      zoomLink: true,
      zoomPassword: true,
      zoomMeetingId: true,
      thirtyMinReminderSentAt: true,
    },
  });

  let sent = 0;

  for (const client of clients) {
    if (!client.nextMeetingAt) continue;

    if (
      client.thirtyMinReminderSentAt &&
      client.thirtyMinReminderSentAt.getTime() === client.nextMeetingAt.getTime()
    ) {
      continue;
    }

    await sendSessionReminder(client.id, client.name, client.nextMeetingAt, client.zoomLink, client.zoomPassword, client.zoomMeetingId);
    await prisma.user.update({
      where: { id: client.id },
      data: { thirtyMinReminderSentAt: client.nextMeetingAt },
    });
    sent++;
  }

  return NextResponse.json({ checked: clients.length, sent });
}
