import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dupes = await prisma.marcImportRecord.findMany({
    where: { status: "DUPLICATE" },
    select: { title: true, author: true, errorMessage: true, duplicateOfBookId: true },
    take: 15,
  });
  console.log("Sample DUPLICATE records:");
  for (const d of dupes) {
    console.log({ title: d.title, author: d.author, reason: d.errorMessage, bookId: d.duplicateOfBookId });
  }

  const books = await prisma.book.findMany({
    where: { isArchived: false },
    include: { copies: { take: 1 } },
  });
  console.log("\nCatalog books:", books.length);
  for (const b of books) {
    console.log({ id: b.id, title: b.title, accession: b.copies[0]?.accessionNumber });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
