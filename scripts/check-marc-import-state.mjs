import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.marcImportBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { _count: { select: { records: true } } },
  });

  console.log("=== Import Batches ===");
  for (const b of batches) {
    console.log({
      id: b.id,
      status: b.status,
      filename: b.filename,
      total: b.totalRecords,
      importedCount: b.importedCount,
      recordRows: b._count.records,
    });
  }

  const recordStatuses = await prisma.marcImportRecord.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log("\n=== Import Record Status Counts ===", recordStatuses);

  const validPending = await prisma.marcImportRecord.count({ where: { status: "VALID" } });
  const imported = await prisma.marcImportRecord.count({ where: { status: "IMPORTED" } });
  const withBookId = await prisma.marcImportRecord.count({
    where: { importedBookId: { not: null } },
  });

  console.log("\nVALID (preview only, not in Book table):", validPending);
  console.log("IMPORTED status:", imported);
  console.log("With importedBookId:", withBookId);

  const bookCount = await prisma.book.count({ where: { isArchived: false } });
  console.log("\nActive Book rows:", bookCount);

  const sampleValid = await prisma.marcImportRecord.findMany({
    where: { status: "VALID" },
    take: 3,
    select: { id: true, title: true, batchId: true, recordIndex: true },
  });
  if (sampleValid.length) {
    console.log("\nSample VALID records stuck in preview:", sampleValid);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
