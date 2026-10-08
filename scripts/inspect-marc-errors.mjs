import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const statuses = await prisma.marcImportRecord.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log("Status counts:", statuses);

  const errors = await prisma.marcImportRecord.findMany({
    where: { status: "ERROR" },
    select: { errorMessage: true },
    take: 500,
  });

  const byMsg = new Map();
  for (const e of errors) {
    const msg = e.errorMessage || "(none)";
    byMsg.set(msg, (byMsg.get(msg) || 0) + 1);
  }

  console.log("\nTop error messages:");
  [...byMsg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([msg, count]) => console.log(count, msg));

  const imported = await prisma.marcImportRecord.count({
    where: { status: "IMPORTED", importedBookId: { not: null } },
  });
  const books = await prisma.book.count({ where: { isArchived: false } });
  console.log("\nIMPORTED with bookId:", imported);
  console.log("Active books:", books);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
