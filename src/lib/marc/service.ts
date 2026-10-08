import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { Book } from "@prisma/client";
import type { HarrisBibliographicInput, MarcFieldData, MarcRecordData } from "./types";
import { buildMarcFromHarris, normalizeMarcjsRecord } from "./mapping";
import { extractSimplifiedFromMarc } from "./extract";
import { sanitizeMarcText } from "./validation";
import { MARC_CONTROL_TAGS } from "./types";

function bookToHarrisInput(
  book: Book,
  accessionNumber: string,
  overrides?: Partial<HarrisBibliographicInput>
): HarrisBibliographicInput {
  return {
    title: book.title,
    author: book.author,
    editor: book.editor,
    edition: book.edition,
    placeOfPublication: book.placeOfPublication || "Unknown",
    publisher: book.publisher || "Unknown",
    copyright: book.publicationYear || new Date().getFullYear(),
    pages: book.numberOfPages || 1,
    illustration: book.illustration,
    seriesName: book.seriesName,
    seriesNumber: book.seriesNumber,
    note: book.note || book.description,
    isbn: book.isbn,
    callNumber: book.callNumber || "UNKNOWN",
    accessionNumber,
    subtitle: book.subtitle,
    subject: book.subject,
    ddc: book.ddc,
    lcClassification: book.lcClassification,
    ...overrides,
  };
}

async function persistMarcFields(
  tx: Prisma.TransactionClient,
  marcRecordId: string,
  fields: MarcFieldData[]
) {
  await tx.marcSubfield.deleteMany({ where: { marcField: { marcRecordId } } });
  await tx.marcField.deleteMany({ where: { marcRecordId } });

  for (const field of fields) {
    const created = await tx.marcField.create({
      data: {
        marcRecordId,
        tag: field.tag,
        ind1: (field.ind1 ?? " ").slice(0, 1),
        ind2: (field.ind2 ?? " ").slice(0, 1),
        controlValue: field.controlValue != null ? sanitizeMarcText(field.controlValue) : null,
        fieldOrder: field.fieldOrder ?? 0,
      },
    });

    if (field.subfields?.length) {
      await tx.marcSubfield.createMany({
        data: field.subfields.map((sub, i) => ({
          marcFieldId: created.id,
          code: sub.code.slice(0, 1),
          value: sanitizeMarcText(sub.value),
          subfieldOrder: sub.subfieldOrder ?? i,
        })),
      });
    }
  }
}

export async function loadMarcRecordData(bookId: string): Promise<MarcRecordData | null> {
  const record = await prisma.marcRecord.findUnique({
    where: { bookId },
    include: {
      fields: {
        include: { subfields: { orderBy: { subfieldOrder: "asc" } } },
        orderBy: { fieldOrder: "asc" },
      },
    },
  });
  if (!record) return null;

  return {
    leader: record.leader,
    controlNumber001: record.controlNumber001 || undefined,
    recordStatus: record.recordStatus || undefined,
    recordType: record.recordType || undefined,
    bibliographicLevel: record.bibliographicLevel || undefined,
    encodingLevel: record.encodingLevel || undefined,
    catalogingForm: record.catalogingForm || undefined,
    fields: record.fields.map((f) => ({
      tag: f.tag,
      ind1: f.ind1,
      ind2: f.ind2,
      controlValue: f.controlValue || undefined,
      fieldOrder: f.fieldOrder,
      subfields: f.subfields.map((s) => ({
        code: s.code,
        value: s.value,
        subfieldOrder: s.subfieldOrder,
      })),
    })),
  };
}

export class AccessionConflictError extends Error {
  constructor(
    public accessionNumber: string,
    public existingBookId?: string
  ) {
    super(`Accession Number already exists: ${accessionNumber}`);
    this.name = "AccessionConflictError";
  }
}

async function saveMarcRecordInTx(
  tx: Prisma.TransactionClient,
  bookId: string,
  marc: MarcRecordData
) {
  const control001 =
    marc.controlNumber001 ||
    marc.fields.find((f) => f.tag === "001")?.controlValue ||
    null;

  const existing = await tx.marcRecord.findUnique({ where: { bookId } });
  const record = existing
    ? await tx.marcRecord.update({
        where: { bookId },
        data: {
          leader: marc.leader || existing.leader,
          controlNumber001: control001,
          recordStatus: marc.recordStatus,
          recordType: marc.recordType,
          bibliographicLevel: marc.bibliographicLevel,
          encodingLevel: marc.encodingLevel,
          catalogingForm: marc.catalogingForm,
        },
      })
    : await tx.marcRecord.create({
        data: {
          bookId,
          leader: marc.leader || "00000nam a2200000 a 4500",
          controlNumber001: control001,
          recordStatus: marc.recordStatus,
          recordType: marc.recordType,
          bibliographicLevel: marc.bibliographicLevel,
          encodingLevel: marc.encodingLevel,
          catalogingForm: marc.catalogingForm,
        },
      });

  await persistMarcFields(tx, record.id, marc.fields);
}

export async function saveMarcRecord(bookId: string, marc: MarcRecordData) {
  await prisma.$transaction(async (tx) => saveMarcRecordInTx(tx, bookId, marc), {
    timeout: 120000,
  });
}

export async function syncMarcFromBook(
  bookId: string,
  accessionNumber: string,
  overrides?: Partial<HarrisBibliographicInput>
) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error("Book not found");
  const input = bookToHarrisInput(book, accessionNumber, overrides);
  const marc = buildMarcFromHarris(input);
  await saveMarcRecord(bookId, marc);
  return marc;
}

const HARRIS_MANAGED_TAGS = new Set([
  "020", "100", "245", "250", "264", "300", "490", "500", "650", "700", "082", "050", "090", "952",
]);

/** Replace only Harris-mapped MARC tags; preserve all other existing tags/subfields. */
export async function mergeMarcFromHarrisInput(bookId: string, input: HarrisBibliographicInput) {
  const existing = await loadMarcRecordData(bookId);
  const fresh = buildMarcFromHarris(input);

  if (!existing) {
    await saveMarcRecord(bookId, fresh);
    return fresh;
  }

  const preserved = existing.fields.filter((field) => !HARRIS_MANAGED_TAGS.has(field.tag));
  const mergedFields = [...preserved, ...fresh.fields].map((field, index) => ({
    ...field,
    fieldOrder: index,
  }));

  await saveMarcRecord(bookId, {
    leader: existing.leader || fresh.leader,
    controlNumber001: existing.controlNumber001 || fresh.controlNumber001,
    recordStatus: existing.recordStatus,
    recordType: existing.recordType,
    bibliographicLevel: existing.bibliographicLevel,
    encodingLevel: existing.encodingLevel,
    catalogingForm: existing.catalogingForm,
    fields: mergedFields,
  });

  return { ...existing, fields: mergedFields };
}

export async function syncMarcFromHarrisInput(bookId: string, input: HarrisBibliographicInput) {
  const marc = buildMarcFromHarris(input);
  await saveMarcRecord(bookId, marc);
  return marc;
}

function generatedAccessionNumber() {
  return `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function importMarcAsBook(marc: MarcRecordData, addedById: string) {
  const simplified = extractSimplifiedFromMarc(marc);

  if (!simplified.title?.trim()) {
    throw new Error("Cannot import record without title (245 $a).");
  }

  const accession = simplified.accessionNumber?.trim() || generatedAccessionNumber();

  const { book, accessionNumber } = await prisma.$transaction(
    async (tx) => {
      const existingCopy = await tx.bookCopy.findUnique({
        where: { accessionNumber: accession },
        select: { bookId: true },
      });
      if (existingCopy) {
        throw new AccessionConflictError(accession, existingCopy.bookId);
      }

      const created = await tx.book.create({
        data: {
          title: simplified.title.trim(),
          subtitle: simplified.subtitle,
          author: simplified.author || "",
          editor: simplified.editor,
          publisher: simplified.publisher || null,
          placeOfPublication: simplified.placeOfPublication || null,
          publicationYear: simplified.copyright,
          edition: simplified.edition,
          numberOfPages: simplified.pages,
          illustration: simplified.illustration,
          seriesName: simplified.seriesName,
          seriesNumber: simplified.seriesNumber,
          note: simplified.note,
          description: simplified.note,
          isbn: simplified.isbn,
          callNumber: simplified.callNumber,
          ddc: simplified.ddc,
          lcClassification: simplified.lcClassification,
          subject: simplified.subject,
          addedById,
        },
      });

      await tx.bookCopy.create({
        data: {
          bookId: created.id,
          accessionNumber: accession,
          status: "AVAILABLE",
        },
      });

      return { book: created, accessionNumber: accession };
    },
    { timeout: 30000 }
  );

  try {
    await saveMarcRecord(book.id, marc);
  } catch (err) {
    await prisma.book.delete({ where: { id: book.id } }).catch(() => undefined);
    throw err;
  }

  return { book, accessionNumber };
}

export function marcFieldsFromEditorRows(
  rows: {
    tag: string;
    ind1?: string;
    ind2?: string;
    controlValue?: string;
    subfields?: { code: string; value: string }[];
  }[]
): MarcFieldData[] {
  return rows.map((row, i) => {
    const tag = row.tag.padStart(3, "0").slice(-3);
    if (MARC_CONTROL_TAGS.has(tag) || row.controlValue != null) {
      return { tag, controlValue: row.controlValue ?? "", fieldOrder: i };
    }
    return {
      tag,
      ind1: (row.ind1 ?? " ").slice(0, 1),
      ind2: (row.ind2 ?? " ").slice(0, 1),
      subfields: (row.subfields || []).map((s, j) => ({
        code: s.code.slice(0, 1),
        value: sanitizeMarcText(s.value),
        subfieldOrder: j,
      })),
      fieldOrder: i,
    };
  });
}

export { normalizeMarcjsRecord, bookToHarrisInput };
