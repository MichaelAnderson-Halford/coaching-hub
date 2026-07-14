import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("changeme123", 10);

  const michael = await prisma.user.upsert({
    where: { email: "michael@example.com" },
    update: {},
    create: {
      email: "michael@example.com",
      name: "Michael",
      role: Role.ADMIN,
      passwordHash: password,
    },
  });

  const ben = await prisma.user.upsert({
    where: { email: "ben@example.com" },
    update: {},
    create: {
      email: "ben@example.com",
      name: "Ben",
      role: Role.ADMIN,
      passwordHash: password,
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      name: "Sample Client",
      role: Role.CLIENT,
      passwordHash: password,
      zoomLink: "https://zoom.us/j/1234567890",
      nextMeetingAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    },
  });

  await prisma.note.create({
    data: {
      content: "Kickoff session: defined 90-day goals and accountability check-ins.",
      clientId: client.id,
      authorId: michael.id,
    },
  });

  await prisma.win.create({
    data: {
      content: "Landed the promotion we'd been working toward since January.",
      clientId: client.id,
    },
  });

  await prisma.resource.create({
    data: {
      title: "Weekly Reflection Template",
      url: "https://example.com/reflection-template",
      description: "Use this each Sunday to prep for our Monday check-in.",
      clientId: client.id,
    },
  });

  await prisma.message.create({
    data: {
      content: "Welcome aboard! Let us know if the Zoom link ever needs updating.",
      senderId: michael.id,
      clientId: client.id,
    },
  });

  console.log("Seeded:", { michael: michael.email, ben: ben.email, client: client.email });
  console.log("All accounts use password: changeme123 (change this immediately in production)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
