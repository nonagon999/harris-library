import type { MarcRecordData } from "./types";
import { loadMarcRecordData } from "./service";
import { marcRecordToMarcjs } from "./mapping";

export async function exportBookAsMarc21(bookId: string): Promise<string> {
  const marc = await loadMarcRecordData(bookId);
  if (!marc) throw new Error("No MARC record found for this book.");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Marc } = require("marcjs");
  const rec = marcRecordToMarcjs(marc);
  return Marc.format(rec, "iso2709");
}

export async function exportBookAsMarcxml(bookId: string): Promise<string> {
  const marc = await loadMarcRecordData(bookId);
  if (!marc) throw new Error("No MARC record found for this book.");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Marc } = require("marcjs");
  const rec = marcRecordToMarcjs(marc);
  return Marc.format(rec, "marcxml");
}

export async function exportBooksAsMarc21(bookIds: string[]): Promise<string> {
  const chunks: string[] = [];
  for (const id of bookIds) {
    chunks.push(await exportBookAsMarc21(id));
  }
  return chunks.join("");
}

export async function exportBooksAsMarcxml(bookIds: string[]): Promise<string> {
  const records: string[] = [];
  for (const id of bookIds) {
    const xml = await exportBookAsMarcxml(id);
    const inner = xml.match(/<record[\s\S]*<\/record>/i)?.[0];
    if (inner) records.push(inner);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<collection xmlns="http://www.loc.gov/MARC21/slim">\n${records.join("\n")}\n</collection>`;
}

export async function exportAllBooksMarc21(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require("@/lib/prisma");
  const books = await prisma.book.findMany({
    where: { isArchived: false },
    select: { id: true },
    orderBy: { title: "asc" },
  });
  return exportBooksAsMarc21(books.map((b: { id: string }) => b.id));
}

export type { MarcRecordData };
