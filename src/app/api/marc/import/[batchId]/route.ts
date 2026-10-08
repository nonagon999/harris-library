import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api/response";

export const runtime = "nodejs";

function parsePreviewJson(raw: string | null) {
  if (!raw) return { preview: [] as unknown[], marc: null };
  try {
    const parsed = JSON.parse(raw) as { preview?: unknown[]; _marc?: unknown };
    return {
      preview: parsed.preview ?? (Array.isArray(parsed) ? parsed : []),
      marc: parsed._marc ?? null,
    };
  } catch (error) {
    console.warn("[marc-import] Invalid previewJson stored:", error instanceof Error ? error.message : error);
    return { preview: [] as unknown[], marc: null };
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    await requireAuth();
    const { batchId } = await params;

    const batch = await prisma.marcImportBatch.findUnique({
      where: { id: batchId },
      include: {
        importedBy: { select: { firstName: true, lastName: true, email: true } },
        records: { orderBy: { recordIndex: "asc" } },
      },
    });

    if (!batch) {
      return jsonError("Import batch not found.", { status: 404, code: "BATCH_NOT_FOUND" });
    }

    return jsonOk({
      ...batch,
      records: batch.records.map((r) => {
        const { preview } = parsePreviewJson(r.previewJson);
        return {
          id: r.id,
          recordIndex: r.recordIndex,
          status: r.status,
          title: r.title,
          author: r.author,
          isbn: r.isbn,
          callNumber: r.callNumber,
          accessionNumber: r.accessionNumber,
          errorMessage: r.errorMessage,
          duplicateOfBookId: r.duplicateOfBookId,
          preview,
        };
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return jsonError("Your session expired. Please sign in again.", { status: 401, code: "UNAUTHORIZED" });
    }
    console.error("[marc-import] Failed to load batch:", error);
    return jsonError("Failed to load import batch.", {
      status: 500,
      code: "BATCH_LOAD_ERROR",
      error: error instanceof Error ? error.message : undefined,
    });
  }
}
