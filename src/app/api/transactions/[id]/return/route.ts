import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { mapReturnToCopyStatus } from "@/lib/circulation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const transaction = await prisma.borrowingTransaction.findUnique({
      where: { id },
      include: { bookCopy: true, book: true },
    });

    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    if (transaction.returnDate) {
      return NextResponse.json({ error: "Book already returned" }, { status: 400 });
    }

    const returnDate = body.returnDate ? new Date(body.returnDate) : new Date();
    const copyStatus = mapReturnToCopyStatus(body.returnCondition, body.markAs);
    const txnStatus = body.markAs === "LOST" ? "LOST" : body.markAs === "DAMAGED" ? "DAMAGED" : "RETURNED";

    const [updated] = await prisma.$transaction([
      prisma.borrowingTransaction.update({
        where: { id },
        data: {
          returnDate,
          status: txnStatus,
          returnNotes: body.returnNotes,
          returnCondition: body.returnCondition,
        },
        include: { borrower: true, book: true, bookCopy: true },
      }),
      prisma.bookCopy.update({
        where: { id: transaction.bookCopyId },
        data: { status: copyStatus, condition: body.returnCondition || transaction.bookCopy.condition },
      }),
    ]);

    await logAudit({
      userId: user.id,
      action: "Returned Book",
      module: "Circulation",
      recordId: updated.id,
      details: `${transaction.book.title} (${transaction.bookCopy.accessionNumber})`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to return book" }, { status: 500 });
  }
}
