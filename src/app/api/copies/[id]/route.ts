import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const copy = await prisma.bookCopy.update({
      where: { id },
      data: {
        accessionNumber: body.accessionNumber,
        barcode: body.barcode,
        locationId: body.locationId || null,
        condition: body.condition,
        status: body.status,
        notes: body.notes,
      },
      include: { location: true, book: true },
    });

    await logAudit({
      userId: user.id,
      action: "Updated Book Copy",
      module: "Books",
      recordId: copy.id,
      details: copy.accessionNumber,
    });

    return NextResponse.json(copy);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update copy" }, { status: 500 });
  }
}
