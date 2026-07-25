import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendProjectReminder } from "@/lib/notify";

// A project is reminder-worthy if it's overdue, or due within this many
// hours from now.
const DUE_SOON_HOURS = 48;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const now = new Date();
  const dueSoonCutoff = new Date(now.getTime() + DUE_SOON_HOURS * 60 * 60 * 1000);

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT", archivedAt: null },
    select: {
      id: true,
      name: true,
      homeworkItems: {
        where: {
          completed: false,
          dueDate: { lte: dueSoonCutoff },
        },
        select: { title: true, dueDate: true },
      },
    },
  });

  let sent = 0;

  for (const client of clients) {
    if (client.homeworkItems.length === 0) continue;

    const items = client.homeworkItems
      .filter((h) => h.dueDate)
      .map((h) => ({
        title: h.title,
        dueDate: h.dueDate as Date,
        overdue: (h.dueDate as Date).getTime() < now.getTime(),
      }));

    if (items.length === 0) continue;

    await sendProjectReminder(client.id, client.name, items);
    sent++;
  }

  return NextResponse.json({ checked: clients.length, sent });
}
