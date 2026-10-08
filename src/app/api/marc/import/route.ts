import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseMarcFile } from "@/lib/marc/parser";
import { buildDuplicateIndex, findDuplicateMatchesFromIndex, registerBookInIndex } from "@/lib/marc/duplicates";
import { MAX_MARC_UPLOAD_BYTES } from "@/lib/marc/types";
import { jsonError, jsonOk } from "@/lib/api/response";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_EXTENSIONS = [".mrc", ".marc", ".xml", ".txt"];

function authFailure(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return jsonError("Your session expired. Please sign in again.", {
      status: 401,
      code: "UNAUTHORIZED",
    });
  }
  return null;
}

export async function POST(request: NextRequest) {
  const started = Date.now();

  try {
    const user = await requireAuth();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("No file was uploaded.", { status: 400, code: "NO_FILE" });
    }

    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    console.log("[marc-import] Upload started:", filename, "size:", file.size, "user:", user.email);

    if (!ALLOWED_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext))) {
      return jsonError("Unsupported file type. Use Koha MARC exports (.mrc, .marc, or .xml).", {
        status: 400,
        code: "INVALID_FILE_TYPE",
      });
    }

    if (file.size === 0) {
      return jsonError("The uploaded file is empty.", { status: 400, code: "EMPTY_FILE" });
    }

    if (file.size > MAX_MARC_UPLOAD_BYTES) {
      return jsonError("File exceeds 10 MB limit.", { status: 400, code: "FILE_TOO_LARGE" });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let format: "iso2709" | "marcxml";
    let records: ReturnType<typeof parseMarcFile>["records"];

    try {
      const parsed = parseMarcFile(filename, buffer);
      format = parsed.format;
      records = parsed.records;
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : "Unable to process the uploaded Koha file.";
      console.error("[marc-import] Parse failed:", filename, message);
      return jsonError(message, {
        status: 400,
        code: "INVALID_MARC_FILE",
        error: message,
      });
    }

    console.log("[marc-import] Parsed", records.length, "records as", format);

    let valid = 0;
    let errors = 0;
    let duplicates = 0;

    const duplicateIndex = await buildDuplicateIndex();

    const batch = await prisma.marcImportBatch.create({
      data: {
        filename,
        fileFormat: format,
        importedById: user.id,
        totalRecords: records.length,
        status: "PREVIEW",
      },
    });

    const rows: {
      batchId: string;
      recordIndex: number;
      status: string;
      controlNumber: string | null;
      title: string | null;
      author: string | null;
      isbn: string | null;
      callNumber: string | null;
      accessionNumber: string | null;
      errorMessage: string | null;
      duplicateOfBookId: string | null;
      previewJson: string;
    }[] = [];

    for (const rec of records) {
      let status: "VALID" | "ERROR" | "DUPLICATE" = "VALID";
      let errorMessage: string | null = null;
      let duplicateOfBookId: string | null = null;

      if (rec.errors.length) {
        status = "ERROR";
        errorMessage = rec.errors.join(" ");
        errors += 1;
      } else {
        const dupes = findDuplicateMatchesFromIndex(
          {
            isbn: rec.simplified.isbn,
            accessionNumber: rec.simplified.accessionNumber,
            controlNumber001: rec.simplified.controlNumber001,
            title: rec.simplified.title,
            author: rec.simplified.author,
            callNumber: rec.simplified.callNumber,
          },
          duplicateIndex
        );
        if (dupes.length) {
          status = "DUPLICATE";
          duplicateOfBookId = dupes[0].bookId;
          duplicates += 1;
        } else {
          valid += 1;
          registerBookInIndex(
            duplicateIndex,
            {
              id: `preview-${rec.index}`,
              title: rec.simplified.title || "",
              author: rec.simplified.author || "",
              isbn: rec.simplified.isbn,
              callNumber: rec.simplified.callNumber,
            },
            {
              accessionNumber: rec.simplified.accessionNumber || undefined,
              controlNumber001: rec.simplified.controlNumber001,
            }
          );
        }
      }

      rows.push({
        batchId: batch.id,
        recordIndex: rec.index,
        status,
        controlNumber: rec.simplified.controlNumber001 || null,
        title: rec.simplified.title || null,
        author: rec.simplified.author || null,
        isbn: rec.simplified.isbn || null,
        callNumber: rec.simplified.callNumber || null,
        accessionNumber: rec.simplified.accessionNumber || null,
        errorMessage,
        duplicateOfBookId,
        previewJson: JSON.stringify({ preview: rec.rawPreview, _marc: rec.marc }),
      });
    }

    const CHUNK = 50;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await prisma.marcImportRecord.createMany({ data: rows.slice(i, i + CHUNK) });
    }

    await prisma.marcImportBatch.update({
      where: { id: batch.id },
      data: {
        duplicateCount: duplicates,
        errorCount: errors,
        reportJson: JSON.stringify({ valid, errors, duplicates, total: records.length }),
      },
    });

    console.log(
      "[marc-import] Preview ready:",
      batch.id,
      "valid:", valid,
      "duplicates:", duplicates,
      "errors:", errors,
      "elapsedMs:", Date.now() - started
    );

    return jsonOk(
      {
        batchId: batch.id,
        filename,
        format,
        total: records.length,
        valid,
        duplicates,
        errors,
        imported: 0,
        skipped: 0,
        errorsList: [],
      },
      { message: "Import preview ready.", status: 200 }
    );
  } catch (error) {
    const authRes = authFailure(error);
    if (authRes) return authRes;

    console.error("[marc-import] Unexpected failure:", error);
    return jsonError("Unable to process the uploaded Koha file.", {
      status: 500,
      code: "IMPORT_PROCESSING_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
