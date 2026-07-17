import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.user.findMany({ where: { role: "CLIENT" } });

  for (const client of clients) {
    if ((client as any).ninetyDayPlan) {
      console.log(`Skipping ${client.name} — already has a client-level plan.`);
      continue;
    }

    const earliestBusiness = await prisma.business.findFirst({
      where: { clientId: client.id },
      orderBy: { createdAt: "asc" },
    });

    const plan = (earliestBusiness as any)?.ninetyDayPlan;
    if (!plan) {
      console.log(`${client.name} had no plan to move.`);
      continue;
    }

    await prisma.user.update({
      where: { id: client.id },
      data: { ninetyDayPlan: plan } as any,
    });

    console.log(`Moved plan for ${client.name} to the client level.`);
  }

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
