import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  getLibrarySettings,
  syncOverdueStatuses,
  mapReturnToCopyStatus,
} from "@/lib/circulation";
import { generateTransactionNo } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await syncOverdueStatuses();

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const borrowerId = searchParams.get("borrowerId") || "";
    const search = searchParams.get("search") || "";

    const where = {
      ...(status ? { status } : {}),
      ...(borrowerId ? { borrowerId } : {}),
      ...(search
        ? {
            OR: [
              { transactionNo: { contains: search } },
              { book: { title: { contains: search } } },
              { bookCopy: { accessionNumber: { contains: search } } },
              { borrower: { firstName: { contains: search } } },
              { borrower: { lastName: { contains: search } } },
            ],
          }
        : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.borrowingTransaction.findMany({
        where,
        include: {
          borrower: true,
          book: true,
          bookCopy: { include: { location: true } },
          librarian: { select: { firstName: true, lastName: true } },
        },
        orderBy: { borrowDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.borrowingTransaction.count({ where }),
    ]);

    return NextResponse.json({ transactions, total, page, limit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const copy = await prisma.bookCopy.findUnique({
      where: { id: body.bookCopyId },
      include: { book: true },
    });
    if (!copy) return NextResponse.json({ error: "Book copy not found" }, { status: 404 });
    if (copy.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Book copy is not available for borrowing" }, { status: 400 });
    }

    const borrower = await prisma.borrower.findUnique({ where: { id: body.borrowerId } });
    if (!borrower || borrower.status !== "ACTIVE") {
      return NextResponse.json({ error: "Borrower is not active" }, { status: 400 });
    }

    const settings = await getLibrarySettings();
    const activeCount = await prisma.borrowingTransaction.count({
      where: { borrowerId: body.borrowerId, returnDate: null },
    });
    if (activeCount >= settings.maxBooksAllowed) {
      return NextResponse.json(
        { error: `Borrower has reached maximum of ${settings.maxBooksAllowed} books` },
        { status: 400 }
      );
    }

    const borrowDate = body.borrowDate ? new Date(body.borrowDate) : new Date();
    const dueDate = body.dueDate
      ? new Date(body.dueDate)
      : new Date(borrowDate.getTime() + settings.borrowingPeriodDays * 86400000);

    const transactionNo = body.transactionNo || (await generateTransactionNo());

    const [transaction] = await prisma.$transaction([
      prisma.borrowingTransaction.create({
        data: {
          transactionNo,
          borrowerId: body.borrowerId,
          bookId: copy.bookId,
          bookCopyId: copy.id,
          borrowDate,
          dueDate,
          status: "BORROWED",
          librarianId: user.id,
          notes: body.notes,
        },
        include: { borrower: true, book: true, bookCopy: true },
      }),
      prisma.bookCopy.update({
        where: { id: copy.id },
        data: { status: "BORROWED" },
      }),
    ]);

    await logAudit({
      userId: user.id,
      action: "Borrowed Book",
      module: "Circulation",
      recordId: transaction.id,
      details: `${copy.book.title} (${copy.accessionNumber})`,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
