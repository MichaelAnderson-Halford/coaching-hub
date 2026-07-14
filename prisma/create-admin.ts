import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "michael@providerpro.co.uk";
  const password = "Rayolga1234!!";
  const name = "Michael";
const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN, name },
    create: { email, passwordHash, role: Role.ADMIN, name },
  });

  console.log("Admin account ready:", user.email);
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
