import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const withCopies = await prisma.book.count({
    where: { isArchived: false, copies: { some: {} } },
  });
  const withMarc = await prisma.book.count({
    where: { isArchived: false, marcRecord: { isNot: null } },
  });
  const orphans = await prisma.book.count({
    where: { isArchived: false, copies: { none: {} } },
  });
  console.log({ withCopies, withMarc, orphans, total: withCopies + orphans });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
