import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { commitImportRecords } from "../src/lib/marc/import-commit";

async function main() {
  const pending = await prisma.marcImportRecord.count({
    where: { status: "VALID", importedBookId: null },
  });

  if (pending === 0) {
    console.log("No VALID preview records waiting to sync.");
    return;
  }

  const admin =
    (await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.findFirst({ orderBy: { createdAt: "asc" } }));

  if (!admin) {
    throw new Error("No user found to attribute MARC sync imports.");
  }

  console.log(`Syncing ${pending} VALID preview record(s) into Book catalog (user: ${admin.email})...`);

  const beforeBooks = await prisma.book.count({ where: { isArchived: false } });

  const result = await commitImportRecords({
    userId: admin.id,
    skipDuplicates: true,
  });

  const afterBooks = await prisma.book.count({ where: { isArchived: false } });

  console.log("\n=== Sync complete ===");
  console.log(`Processed: ${result.processed}`);
  console.log(`Imported:  ${result.imported}`);
  console.log(`Skipped:   ${result.skipped} (duplicates)`);
  console.log(`Failed:    ${result.failed}`);
  console.log(`Books:     ${beforeBooks} → ${afterBooks} (+${afterBooks - beforeBooks})`);

  if (result.failed > 0) {
    const errors = result.report.filter((r) => r.status === "ERROR").slice(0, 10);
    console.log("\nFirst errors:");
    for (const e of errors) {
      console.log(`  Record #${e.recordIndex}: ${e.message}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
