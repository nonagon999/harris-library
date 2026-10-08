import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getLibrarySettings } from "@/lib/circulation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const transaction = await prisma.borrowingTransaction.findUnique({ where: { id } });
    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    if (transaction.returnDate) {
      return NextResponse.json({ error: "Cannot renew returned book" }, { status: 400 });
    }

    const settings = await getLibrarySettings();
    if (transaction.renewalCount >= settings.renewalLimit) {
      return NextResponse.json(
        { error: `Renewal limit of ${settings.renewalLimit} reached` },
        { status: 400 }
      );
    }

    const newDueDate = body.dueDate
      ? new Date(body.dueDate)
      : new Date(Date.now() + settings.borrowingPeriodDays * 86400000);

    const updated = await prisma.borrowingTransaction.update({
      where: { id },
      data: {
        dueDate: newDueDate,
        renewalCount: { increment: 1 },
        status: "RENEWED",
      },
      include: { borrower: true, book: true, bookCopy: true },
    });

    await logAudit({
      userId: user.id,
      action: "Renewed Book",
      module: "Circulation",
      recordId: updated.id,
      details: `New due date: ${newDueDate.toISOString()}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to renew" }, { status: 500 });
  }
}
