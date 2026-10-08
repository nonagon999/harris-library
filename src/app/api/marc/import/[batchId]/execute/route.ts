import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { commitImportRecords } from "@/lib/marc/import-commit";
import { jsonError, jsonOk } from "@/lib/api/response";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    const user = await requireAuth();
    const { batchId } = await params;
    const body = await request.json().catch(() => ({}));
    const skipDuplicates = body.skipDuplicates !== false;
    const recordIds: string[] | undefined = body.recordIds;

    const batch = await prisma.marcImportBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return jsonError("Import batch not found.", { status: 404, code: "BATCH_NOT_FOUND" });
    }

    const pending = await prisma.marcImportRecord.count({
      where: {
        batchId,
        status: "VALID",
        importedBookId: null,
        ...(recordIds?.length ? { id: { in: recordIds } } : {}),
      },
    });

    if (pending === 0) {
      return jsonError("No valid records are waiting to be added to the catalog.", {
        status: 400,
        code: "NOTHING_TO_IMPORT",
      });
    }

    console.log("[marc-import] Executing batch", batchId, "pending records:", pending);

    const result = await commitImportRecords({
      batchId,
      recordIds,
      userId: user.id,
      skipDuplicates,
    });

    await logAudit({
      userId: user.id,
      action: "MARC Import",
      module: "MARC",
      recordId: batchId,
      details: `Imported ${result.imported} books from ${batch.filename}`,
    });

    return jsonOk({
      imported: result.imported,
      skipped: result.skipped,
      failed: result.failed,
      report: result.report,
      errors: result.report.filter((r) => r.status === "ERROR"),
    }, { message: "Import completed successfully." });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return jsonError("Your session expired. Please sign in again.", { status: 401, code: "UNAUTHORIZED" });
    }
    console.error("[marc-import] Execute failed:", error);
    return jsonError("Import execution failed.", {
      status: 500,
      code: "IMPORT_EXECUTE_ERROR",
      error: error instanceof Error ? error.message : undefined,
    });
  }
}
