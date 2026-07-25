import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWelcomeResendEmail } from "@/lib/notify";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT", archivedAt: null },
    select: { id: true, name: true, email: true },
  });

  let sent = 0;
  for (const client of clients) {
    await sendWelcomeResendEmail(client.id, client.name, client.email);
    sent++;
  }

  return NextResponse.json({ sent });
}
