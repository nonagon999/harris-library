import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { syncMarcFromBook } from "../src/lib/marc/service";

async function main() {
  const books = await prisma.book.findMany({
    where: { isArchived: false, marcRecord: null },
    include: { copies: { orderBy: { accessionNumber: "asc" }, take: 1 } },
  });

  console.log(`Found ${books.length} books without MARC records.`);

  let created = 0;
  let failed = 0;

  for (const book of books) {
    try {
      await syncMarcFromBook(book.id, book.copies[0]?.accessionNumber || "UNKNOWN");
      created += 1;
      console.log(`✓ ${book.title}`);
    } catch (err) {
      failed += 1;
      console.error(`✗ ${book.title}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nDone. Created: ${created}, Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
