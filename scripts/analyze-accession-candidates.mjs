import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function firstSub(fields, tag, code) {
  for (const f of fields) {
    if (f.tag !== tag) continue;
    const s = f.subfields?.find((x) => x.code === code);
    if (s?.value) return s.value.trim();
  }
  return null;
}

async function main() {
  const rows = await prisma.marcImportRecord.findMany({
    select: { previewJson: true },
  });
  const p = new Set();
  const s6 = new Set();
  const a = new Set();
  for (const row of rows) {
    const fields = JSON.parse(row.previewJson)._marc?.fields || [];
    const pv = firstSub(fields, "952", "p");
    const v6 = firstSub(fields, "952", "6");
    const va = firstSub(fields, "952", "a");
    if (pv) p.add(pv);
    if (v6) s6.add(v6);
    if (va) a.add(va);
  }
  console.log("Unique 952$p:", p.size, [...p].slice(0, 10));
  console.log("Unique 952$6:", s6.size);
  console.log("Unique 952$a:", a.size, [...a]);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
