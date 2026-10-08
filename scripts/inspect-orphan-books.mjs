import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orphans = await prisma.book.findMany({
    where: { isArchived: false, copies: { none: {} } },
    select: { id: true, title: true, createdAt: true },
    take: 20,
  });
  const orphanCount = await prisma.book.count({
    where: { isArchived: false, copies: { none: {} } },
  });
  console.log("Books without copies:", orphanCount);
  if (orphans.length) console.log("Sample:", orphans);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
