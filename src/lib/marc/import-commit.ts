import { prisma } from "@/lib/prisma";
import { AccessionConflictError, importMarcAsBook } from "@/lib/marc/service";
import type { MarcRecordData } from "@/lib/marc/types";
import {
  buildDuplicateIndex,
  findDuplicateMatchesFromIndex,
  registerBookInIndex,
  type DuplicateIndex,
} from "@/lib/marc/duplicates";
import { extractSimplifiedFromMarc } from "@/lib/marc/extract";

export type ImportCommitReport = {
  recordIndex: number;
  status: string;
  message?: string;
  bookId?: string;
};

function marcFromPreviewJson(previewJson: string): MarcRecordData {
  const parsed = JSON.parse(previewJson) as { preview?: unknown; _marc?: MarcRecordData };
  if (parsed._marc) return parsed._marc;
  return rebuildMarcFromPreview(parsed.preview || parsed);
}

function rebuildMarcFromPreview(preview: unknown): MarcRecordData {
  const fields = Array.isArray(preview) ? preview : [];
  return {
    leader: "00000nam a2200000 a 4500",
    fields: fields.map((f: Record<string, unknown>, i: number) => ({
      tag: String(f.tag),
      ind1: f.ind1 ? String(f.ind1) : " ",
      ind2: f.ind2 ? String(f.ind2) : " ",
      controlValue: f.value != null ? String(f.value) : undefined,
      subfields: Array.isArray(f.subfields)
        ? f.subfields.map((s: { code: string; value: string }, j: number) => ({
            code: s.code,
            value: s.value,
            subfieldOrder: j,
          }))
        : undefined,
      fieldOrder: i,
    })),
  };
}

export async function commitImportRecords(options: {
  batchId?: string;
  recordIds?: string[];
  userId: string;
  skipDuplicates?: boolean;
  duplicateIndex?: DuplicateIndex;
}) {
  const skipDuplicates = options.skipDuplicates !== false;
  const index = options.duplicateIndex ?? (await buildDuplicateIndex());

  const where = {
    status: "VALID" as const,
    importedBookId: null,
    ...(options.batchId ? { batchId: options.batchId } : {}),
    ...(options.recordIds?.length ? { id: { in: options.recordIds } } : {}),
  };

  const rows = await prisma.marcImportRecord.findMany({
    where,
    orderBy: { recordIndex: "asc" },
  });

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const report: ImportCommitReport[] = [];

  for (const row of rows) {
    if (!row.previewJson) {
      failed += 1;
      report.push({ recordIndex: row.recordIndex, status: "ERROR", message: "Missing MARC data." });
      continue;
    }

    try {
      const marc = marcFromPreviewJson(row.previewJson);
      const simplified = extractSimplifiedFromMarc(marc);

      const dupes = findDuplicateMatchesFromIndex(
        {
          isbn: simplified.isbn,
          accessionNumber: simplified.accessionNumber,
          controlNumber001: simplified.controlNumber001,
          title: simplified.title,
          author: simplified.author,
          callNumber: simplified.callNumber,
        },
        index
      );

      if (dupes.length && skipDuplicates) {
        skipped += 1;
        await prisma.marcImportRecord.update({
          where: { id: row.id },
          data: {
            status: "DUPLICATE",
            duplicateOfBookId: dupes[0].bookId,
            errorMessage: dupes[0].reason,
          },
        });
        report.push({
          recordIndex: row.recordIndex,
          status: "SKIPPED",
          message: dupes[0].reason,
          bookId: dupes[0].bookId,
        });
        continue;
      }

      const { book, accessionNumber } = await importMarcAsBook(marc, options.userId);
      imported += 1;

      registerBookInIndex(
        index,
        book,
        { accessionNumber, controlNumber001: simplified.controlNumber001 }
      );

      await prisma.marcImportRecord.update({
        where: { id: row.id },
        data: { status: "IMPORTED", importedBookId: book.id, errorMessage: null },
      });

      report.push({ recordIndex: row.recordIndex, status: "IMPORTED", bookId: book.id });
    } catch (err) {
      if (err instanceof AccessionConflictError) {
        skipped += 1;
        await prisma.marcImportRecord.update({
          where: { id: row.id },
          data: {
            status: "DUPLICATE",
            duplicateOfBookId: err.existingBookId ?? null,
            errorMessage: err.message,
          },
        });
        report.push({
          recordIndex: row.recordIndex,
          status: "SKIPPED",
          message: err.message,
          bookId: err.existingBookId,
        });
        continue;
      }

      failed += 1;
      const message = err instanceof Error ? err.message : "Import failed";
      await prisma.marcImportRecord.update({
        where: { id: row.id },
        data: { status: "ERROR", errorMessage: message },
      });
      report.push({ recordIndex: row.recordIndex, status: "ERROR", message });
      console.warn("[marc-import] Record", row.recordIndex, "commit failed:", message);
    }
  }

  const affectedBatchIds = [...new Set(rows.map((r) => r.batchId))];
  const singleBatch = affectedBatchIds.length === 1;
  for (const batchId of affectedBatchIds) {
    await refreshBatchStats(
      batchId,
      singleBatch ? { imported, skipped, failed, report } : undefined
    );
  }

  return { imported, skipped, failed, report, processed: rows.length };
}

async function refreshBatchStats(
  batchId: string,
  latest?: { imported: number; skipped: number; failed: number; report: ImportCommitReport[] }
) {
  const counts = await prisma.marcImportRecord.groupBy({
    by: ["status"],
    where: { batchId },
    _count: true,
  });

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const importedTotal = byStatus.IMPORTED ?? 0;

  await prisma.marcImportBatch.update({
    where: { id: batchId },
    data: {
      ...(importedTotal > 0 ? { status: "COMPLETED", completedAt: new Date() } : {}),
      importedCount: importedTotal,
      duplicateCount: byStatus.DUPLICATE ?? 0,
      errorCount: byStatus.ERROR ?? 0,
      skippedCount: byStatus.DUPLICATE ?? 0,
      ...(latest ? { reportJson: JSON.stringify(latest) } : {}),
    },
  });
}
