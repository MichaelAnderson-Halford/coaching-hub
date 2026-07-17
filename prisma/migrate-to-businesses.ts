import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

// This script talks to the database directly with raw SQL (rather than the
// generated Prisma Client's typed methods) so that it works regardless of
// whether the client has been regenerated against the new schema yet.
const prisma = new PrismaClient();

async function tableHasColumn(table: string, column: string): Promise<boolean> {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    table,
    column
  )) as any[];
  return rows.length > 0;
}

async function main() {
  console.log("Step 1: Reading existing clients...");
  const clients = (await prisma.$queryRawUnsafe(
    `SELECT id, name, "ninetyDayPlan", insight, "insightUpdatedAt" FROM "User" WHERE role = 'CLIENT'`
  )) as any[];
  console.log(`Found ${clients.length} client(s).`);

  console.log("\nStep 2: Creating the Business table (if it doesn't already exist)...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Business" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "ninetyDayPlan" TEXT,
      "insight" TEXT,
      "insightUpdatedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
      "clientId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
    );
  `);

  console.log("\nStep 3: Creating one default business per existing client...");
  const existingBusinesses = (await prisma.$queryRawUnsafe(
    `SELECT "clientId" FROM "Business"`
  )) as any[];
  const alreadyHasBusiness = new Set(existingBusinesses.map((b: any) => b.clientId));

  const businessIdByClientId: Record<string, string> = {};
  for (const client of clients) {
    if (alreadyHasBusiness.has(client.id)) {
      const existing = (await prisma.$queryRawUnsafe(
        `SELECT id FROM "Business" WHERE "clientId" = $1 LIMIT 1`,
        client.id
      )) as any[];
      businessIdByClientId[client.id] = existing[0].id;
      console.log(`  ${client.name} already has a business — skipping creation.`);
      continue;
    }
    const businessId = randomUUID();
    businessIdByClientId[client.id] = businessId;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Business" (id, name, "ninetyDayPlan", insight, "insightUpdatedAt", "clientId")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      businessId,
      client.name,
      client.ninetyDayPlan,
      client.insight,
      client.insightUpdatedAt,
      client.id
    );
    console.log(`  Created a business for ${client.name}.`);
  }

  console.log("\nStep 4: Adding businessId columns to Note, Win, Resource, Metric...");
  for (const table of ["Note", "Win", "Resource", "Metric"]) {
    if (!(await tableHasColumn(table, "businessId"))) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "businessId" TEXT;`);
      console.log(`  Added businessId to ${table}.`);
    } else {
      console.log(`  ${table} already has businessId — skipping.`);
    }
  }

  console.log("\nStep 5: Filling in businessId for existing notes/wins/resources/metrics...");
  for (const [clientId, businessId] of Object.entries(businessIdByClientId)) {
    await prisma.$executeRawUnsafe(
      `UPDATE "Note" SET "businessId" = $1 WHERE "clientId" = $2 AND "businessId" IS NULL`,
      businessId,
      clientId
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "Win" SET "businessId" = $1 WHERE "clientId" = $2 AND "businessId" IS NULL`,
      businessId,
      clientId
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "Resource" SET "businessId" = $1 WHERE "clientId" = $2 AND "businessId" IS NULL`,
      businessId,
      clientId
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "Metric" SET "businessId" = $1 WHERE "clientId" = $2 AND "businessId" IS NULL`,
      businessId,
      clientId
    );
  }

  console.log("\nStep 6: Verifying nothing was left behind (all counts should be 0)...");
  for (const table of ["Note", "Win", "Resource", "Metric"]) {
    const result = (await prisma.$queryRawUnsafe(
      `SELECT count(*)::int AS count FROM "${table}" WHERE "businessId" IS NULL`
    )) as any[];
    console.log(`  ${table} rows still missing businessId: ${result[0].count}`);
    if (result[0].count > 0) {
      throw new Error(
        `${table} has ${result[0].count} row(s) without a businessId — stopping before making any destructive changes. Nothing has been deleted.`
      );
    }
  }

  console.log("\nStep 7: Locking in the new structure...");
  for (const table of ["Note", "Win", "Resource", "Metric"]) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "businessId" SET NOT NULL;`);
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE;`
      );
    } catch (e: any) {
      if (!String(e.message).includes("already exists")) throw e;
    }
    if (await tableHasColumn(table, "clientId")) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DROP COLUMN "clientId";`);
    }
    console.log(`  ${table} now uses businessId only.`);
  }

  console.log("\nStep 8: Removing the old plan/insight fields from User (now living on Business)...");
  for (const column of ["ninetyDayPlan", "insight", "insightUpdatedAt"]) {
    if (await tableHasColumn("User", column)) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "User" DROP COLUMN "${column}";`);
    }
  }

  console.log("\n✅ Migration complete. Every client now has at least one business, with all their existing data moved across safely.");
}

main()
  .catch((e) => {
    console.error("\n❌ Migration stopped:", e.message);
    console.error("Nothing destructive has necessarily happened yet — review the message above before re-running.");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
