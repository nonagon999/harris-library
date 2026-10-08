import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * Removes orphan Book rows left by failed MARC commits (book created, copy failed)
 * and resets affected import preview rows so they can be synced again safely.
 */
async function main() {
  const orphans = await prisma.book.findMany({
    where: { isArchived: false, copies: { none: {} } },
    select: { id: true, title: true },
  });

  console.log(`Found ${orphans.length} orphan book(s) without copies.`);

  if (orphans.length > 0) {
    const deleted = await prisma.book.deleteMany({
      where: { id: { in: orphans.map((b) => b.id) } },
    });
    console.log(`Deleted ${deleted.count} orphan book(s).`);
  }

  const resetErrors = await prisma.marcImportRecord.updateMany({
    where: {
      status: "ERROR",
      importedBookId: null,
      OR: [
        { errorMessage: { contains: "accessionNumber" } },
        { errorMessage: { contains: "Accession Number already exists" } },
        { errorMessage: { contains: "Transaction" } },
        { errorMessage: { contains: "marcSubfield" } },
        { errorMessage: { contains: "marcField" } },
      ],
    },
    data: {
      status: "VALID",
      errorMessage: null,
      duplicateOfBookId: null,
    },
  });

  const resetDupes = await prisma.marcImportRecord.updateMany({
    where: {
      status: "DUPLICATE",
      importedBookId: null,
      errorMessage: { contains: "Accession Number" },
    },
    data: {
      status: "VALID",
      errorMessage: null,
      duplicateOfBookId: null,
    },
  });

  const badBranchAccession = await prisma.bookCopy.findUnique({
    where: { accessionNumber: "HMC" },
    select: { bookId: true, book: { select: { title: true } } },
  });
  if (badBranchAccession) {
    await prisma.book.delete({ where: { id: badBranchAccession.bookId } });
    console.log(`Removed book with branch-code accession "HMC": ${badBranchAccession.book.title}`);
  }

  console.log(`Reset ${resetErrors.count} ERROR and ${resetDupes.count} DUPLICATE row(s) to VALID for re-sync.`);

  const pending = await prisma.marcImportRecord.count({
    where: { status: "VALID", importedBookId: null },
  });
  console.log(`Pending VALID preview records ready for sync: ${pending}`);
  console.log("\nRun: npm run db:marc-sync");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
