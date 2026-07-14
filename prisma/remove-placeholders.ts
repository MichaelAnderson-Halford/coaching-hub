import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Delete the client first so its notes/wins/resources/messages cascade away
  const client = await prisma.user.deleteMany({ where: { email: "client@example.com" } });
  console.log("Removed placeholder client:", client.count);

  const michael = await prisma.user.deleteMany({ where: { email: "michael@example.com" } });
  console.log("Removed placeholder michael:", michael.count);

  const ben = await prisma.user.deleteMany({ where: { email: "ben@example.com" } });
  console.log("Removed placeholder ben:", ben.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
