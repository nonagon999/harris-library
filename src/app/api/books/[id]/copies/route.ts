import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: bookId } = await params;
    const body = await request.json();

    const existing = await prisma.bookCopy.findUnique({
      where: { accessionNumber: body.accessionNumber },
    });
    if (existing) {
      return NextResponse.json({ error: "Accession number already exists" }, { status: 400 });
    }

    const copy = await prisma.bookCopy.create({
      data: {
        bookId,
        accessionNumber: body.accessionNumber,
        barcode: body.barcode || null,
        locationId: body.locationId || null,
        condition: body.condition || "GOOD",
        status: "AVAILABLE",
        notes: body.notes,
      },
      include: { location: true },
    });

    await logAudit({
      userId: user.id,
      action: "Added Book Copy",
      module: "Books",
      recordId: copy.id,
      details: copy.accessionNumber,
    });

    return NextResponse.json(copy, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add copy" }, { status: 500 });
  }
}
