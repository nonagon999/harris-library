import { PrismaClient } from "@prisma/client";
import { buildMarcFromHarris } from "../src/lib/marc/mapping.ts";
import { extractSimplifiedFromMarc } from "../src/lib/marc/extract.ts";
import { classificationSearchVariants } from "../src/lib/classification.ts";

const prisma = new PrismaClient();

async function cleanup(ids) {
  for (const id of ids) {
    await prisma.marcSubfield.deleteMany({ where: { marcField: { marcRecord: { bookId: id } } } });
    await prisma.marcField.deleteMany({ where: { marcRecord: { bookId: id } } });
    await prisma.marcRecord.deleteMany({ where: { bookId: id } });
    await prisma.bookCopy.deleteMany({ where: { bookId: id } });
    await prisma.book.delete({ where: { id } }).catch(() => {});
  }
}

async function main() {
  const created = [];
  const cases = [
    { title: "LC Test Both", ddc: "005.133", lcClassification: "QA76.73.J38" },
    { title: "LC Test DDC Only", ddc: "005.133", lcClassification: null },
    { title: "LC Test LC Only", ddc: null, lcClassification: "PS3569.O4" },
    { title: "LC Test Neither", ddc: null, lcClassification: null },
  ];

  for (const c of cases) {
    const book = await prisma.book.create({
      data: {
        title: c.title,
        author: "Test Author",
        publisher: "Test Pub",
        placeOfPublication: "Manila",
        publicationYear: 2024,
        numberOfPages: 100,
        callNumber: "TEST-001",
        ddc: c.ddc,
        lcClassification: c.lcClassification,
      },
    });
    created.push(book.id);

    const marc = buildMarcFromHarris({
      title: c.title,
      author: "Test Author",
      placeOfPublication: "Manila",
      publisher: "Test Pub",
      copyright: 2024,
      pages: 100,
      callNumber: "TEST-001",
      accessionNumber: "ACC-TEST",
      ddc: c.ddc,
      lcClassification: c.lcClassification,
    });

    const extracted = extractSimplifiedFromMarc(marc);
    if (extracted.ddc !== c.ddc) throw new Error(`DDC mismatch for ${c.title}`);
    if (extracted.lcClassification !== c.lcClassification) throw new Error(`LC mismatch for ${c.title}`);
  }

  const found = await prisma.book.findFirst({
    where: { lcClassification: { contains: "qa76.73", mode: "insensitive" } },
  });
  if (!found) throw new Error("LC search failed");

  const variants = classificationSearchVariants("QA 76.73");
  if (!variants.includes("QA76.73")) throw new Error("Search variant normalization failed");

  console.log("All LC classification tests passed.");
  await cleanup(created);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
