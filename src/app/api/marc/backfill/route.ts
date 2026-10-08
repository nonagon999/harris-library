import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncMarcFromBook } from "@/lib/marc/service";
import { logAudit } from "@/lib/audit";

/** Backfill MARC records for existing books without one. ADMIN/LIBRARIAN only. */
export async function POST() {
  try {
    const user = await requireAuth();

    const books = await prisma.book.findMany({
      where: { isArchived: false, marcRecord: null },
      include: { copies: { orderBy: { accessionNumber: "asc" }, take: 1 } },
    });

    let created = 0;
    let failed = 0;

    for (const book of books) {
      try {
        await syncMarcFromBook(book.id, book.copies[0]?.accessionNumber || "UNKNOWN");
        created += 1;
      } catch {
        failed += 1;
      }
    }

    await logAudit({
      userId: user.id,
      action: "MARC Legacy Backfill",
      module: "MARC",
      details: `Created ${created} MARC records, ${failed} failed`,
    });

    return NextResponse.json({ total: books.length, created, failed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Backfill failed." }, { status: 500 });
  }
}
