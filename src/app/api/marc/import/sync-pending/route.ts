import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { commitImportRecords } from "@/lib/marc/import-commit";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api/response";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Commit VALID preview records (all batches or one batch) into the canonical Book table. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const batchId = typeof body.batchId === "string" ? body.batchId : undefined;
    const skipDuplicates = body.skipDuplicates !== false;

    const pending = await prisma.marcImportRecord.count({
      where: {
        status: "VALID",
        importedBookId: null,
        ...(batchId ? { batchId } : {}),
      },
    });

    if (pending === 0) {
      return jsonOk({
        imported: 0,
        skipped: 0,
        failed: 0,
        processed: 0,
        report: [],
      }, { message: "No pending MARC preview records to sync." });
    }

    console.log("[marc-import] Sync pending:", pending, batchId ? `batch ${batchId}` : "all batches");

    const result = await commitImportRecords({
      batchId,
      userId: user.id,
      skipDuplicates,
    });

    await logAudit({
      userId: user.id,
      action: "MARC Import Sync",
      module: "MARC",
      recordId: batchId || "all",
      details: `Synced ${result.imported} preview records into catalog (${result.processed} processed)`,
    });

    return jsonOk({
      imported: result.imported,
      skipped: result.skipped,
      failed: result.failed,
      processed: result.processed,
      report: result.report,
    }, { message: `Added ${result.imported} imported book(s) to the catalog.` });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return jsonError("Your session expired. Please sign in again.", { status: 401, code: "UNAUTHORIZED" });
    }
    console.error("[marc-import] Sync pending failed:", error);
    return jsonError("Failed to sync pending MARC records.", {
      status: 500,
      code: "SYNC_PENDING_ERROR",
      error: error instanceof Error ? error.message : undefined,
    });
  }
}
