import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const row = await prisma.marcImportRecord.findFirst({
    where: { title: { contains: "childcraft" } },
    select: { previewJson: true, accessionNumber: true },
  });
  if (!row?.previewJson) return;
  const parsed = JSON.parse(row.previewJson);
  const marc = parsed._marc || parsed;
  const fields = marc.fields || parsed.preview || [];
  const itemFields = fields.filter((f) => f.tag === "952" || f.tag === "949");
  console.log("Stored accessionNumber column:", row.accessionNumber);
  console.log("952/949 fields:", JSON.stringify(itemFields, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
