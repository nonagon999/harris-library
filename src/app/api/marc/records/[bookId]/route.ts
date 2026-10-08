import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { loadMarcRecordData, saveMarcRecord, syncMarcFromBook } from "@/lib/marc/service";
import { marcFieldsFromEditorRows } from "@/lib/marc/service";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import type { MarcRecordData } from "@/lib/marc/types";

export async function GET(_: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    await requireAuth();
    const { bookId } = await params;

    let marc = await loadMarcRecordData(bookId);
    if (!marc) {
      const copy = await prisma.bookCopy.findFirst({ where: { bookId }, orderBy: { accessionNumber: "asc" } });
      marc = await syncMarcFromBook(bookId, copy?.accessionNumber || "UNKNOWN");
    }

    return NextResponse.json(marc);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load MARC record." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ bookId: string }> }) {
  try {
    const user = await requireAuth();
    const { bookId } = await params;
    const body = await request.json();

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

    const marc: MarcRecordData = {
      leader: body.leader || "00000nam a2200000 a 4500",
      controlNumber001: body.controlNumber001,
      recordStatus: body.recordStatus,
      recordType: body.recordType,
      bibliographicLevel: body.bibliographicLevel,
      encodingLevel: body.encodingLevel,
      catalogingForm: body.catalogingForm,
      fields: marcFieldsFromEditorRows(body.fields || []),
    };

    if (!marc.fields.some((f) => f.tag === "245")) {
      return NextResponse.json({ error: "MARC record must include field 245 (Title)." }, { status: 400 });
    }

    await saveMarcRecord(bookId, marc);

    await logAudit({
      userId: user.id,
      action: "Updated MARC Record",
      module: "MARC",
      recordId: bookId,
      details: book.title,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save MARC record." }, { status: 500 });
  }
}
