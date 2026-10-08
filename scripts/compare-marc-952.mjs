import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.marcImportRecord.findMany({
    take: 5,
    orderBy: { recordIndex: "asc" },
    select: { title: true, previewJson: true },
  });

  for (const row of rows) {
    const parsed = JSON.parse(row.previewJson);
    const fields = (parsed._marc || parsed).fields || [];
    const f952 = fields.find((f) => f.tag === "952");
    const subs = Object.fromEntries((f952?.subfields || []).map((s) => [s.code, s.value]));
    const c001 = fields.find((f) => f.tag === "001")?.controlValue;
    console.log("\n", row.title?.slice(0, 40));
    console.log("  001:", c001);
    console.log("  952:", subs);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
