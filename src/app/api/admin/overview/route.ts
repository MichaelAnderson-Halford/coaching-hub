import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ATTENTION_THRESHOLD_DAYS = 14;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const now = Date.now();

  type ClientRow = {
    id: string;
    name: string;
    nextMeetingAt: Date | null;
    zoomLink: string | null;
    notesAsClient: { createdAt: Date }[];
    wins: { createdAt: Date }[];
    threadMessages: { createdAt: Date }[];
  };

  const clients: ClientRow[] = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: {
      id: true,
      name: true,
      nextMeetingAt: true,
      zoomLink: true,
      notesAsClient: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      wins: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      threadMessages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  const upcomingSessions = clients
    .filter((c: ClientRow) => c.nextMeetingAt && new Date(c.nextMeetingAt).getTime() >= now)
    .sort(
      (a: ClientRow, b: ClientRow) =>
        new Date(a.nextMeetingAt!).getTime() - new Date(b.nextMeetingAt!).getTime()
    )
    .slice(0, 10)
    .map((c: ClientRow) => ({ id: c.id, name: c.name, nextMeetingAt: c.nextMeetingAt, zoomLink: c.zoomLink }));

  const needsAttention = clients
    .map((c: ClientRow) => {
      const dates = [
        c.notesAsClient[0]?.createdAt,
        c.wins[0]?.createdAt,
        c.threadMessages[0]?.createdAt,
      ].filter(Boolean) as Date[];
      const last = dates.length
        ? new Date(Math.max(...dates.map((d) => new Date(d).getTime())))
        : null;
      const daysSince = last ? Math.floor((now - last.getTime()) / (1000 * 60 * 60 * 24)) : null;
      return { id: c.id, name: c.name, lastActivityAt: last, daysSince };
    })
    .filter((c: { daysSince: number | null }) => c.daysSince === null || c.daysSince >= ATTENTION_THRESHOLD_DAYS)
    .sort((a: { daysSince: number | null }, b: { daysSince: number | null }) => (b.daysSince ?? 9999) - (a.daysSince ?? 9999));

  const [recentNotes, recentWins, recentMessages] = await Promise.all([
    prisma.note.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { client: { select: { name: true } }, author: { select: { name: true } } },
    }),
    prisma.win.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { client: { select: { name: true } } },
    }),
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { client: { select: { name: true } }, sender: { select: { name: true, role: true } } },
    }),
  ]);

  const activity = [
    ...recentNotes.map((n: any) => ({
      type: "note" as const,
      id: n.id,
      clientId: n.clientId,
      clientName: n.client.name,
      createdAt: n.createdAt,
      summary: `${n.author.name} added a note`,
      content: n.content.replace(/\[\[zoom:[^\]]+\]\]/g, "").trim(),
    })),
    ...recentWins.map((w: any) => ({
      type: "win" as const,
      id: w.id,
      clientId: w.clientId,
      clientName: w.client.name,
      createdAt: w.createdAt,
      summary: "Win logged",
      content: w.content,
    })),
    ...recentMessages.map((m: any) => ({
      type: "message" as const,
      id: m.id,
      clientId: m.clientId,
      clientName: m.client.name,
      createdAt: m.createdAt,
      summary: `${m.sender.name} sent a message`,
      content: m.content,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  return NextResponse.json({ upcomingSessions, needsAttention, activity });
}
