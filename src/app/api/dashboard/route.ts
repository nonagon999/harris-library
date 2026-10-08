import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { syncOverdueStatuses } from "@/lib/circulation";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    await requireAuth();
    await syncOverdueStatuses();

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [
      totalTitles,
      totalCopies,
      availableCopies,
      borrowedCopies,
      overdueCopies,
      totalBorrowers,
      booksAddedThisMonth,
      borrowedThisMonth,
      recentTransactions,
      recentReturns,
      overdueBooks,
      mostBorrowed,
      mostActiveBorrowers,
      booksByLevel,
    ] = await Promise.all([
      prisma.book.count({ where: { isArchived: false } }),
      prisma.bookCopy.count({ where: { status: { not: "ARCHIVED" } } }),
      prisma.bookCopy.count({ where: { status: "AVAILABLE" } }),
      prisma.bookCopy.count({ where: { status: { in: ["BORROWED", "RENEWED"] } } }),
      prisma.bookCopy.count({ where: { status: "OVERDUE" } }),
      prisma.borrower.count({ where: { status: "ACTIVE" } }),
      prisma.book.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
      prisma.borrowingTransaction.count({
        where: { borrowDate: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.borrowingTransaction.findMany({
        take: 8,
        orderBy: { borrowDate: "desc" },
        include: {
          borrower: true,
          book: true,
          bookCopy: true,
        },
      }),
      prisma.borrowingTransaction.findMany({
        where: { returnDate: { not: null } },
        take: 8,
        orderBy: { returnDate: "desc" },
        include: { borrower: true, book: true, bookCopy: true },
      }),
      prisma.borrowingTransaction.findMany({
        where: { status: "OVERDUE", returnDate: null },
        take: 10,
        include: { borrower: true, book: true, bookCopy: true },
        orderBy: { dueDate: "asc" },
      }),
      prisma.borrowingTransaction.groupBy({
        by: ["bookId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.borrowingTransaction.groupBy({
        by: ["borrowerId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.book.groupBy({
        by: ["academicLevel"],
        _count: { id: true },
        where: { isArchived: false },
      }),
    ]);

    const bookIds = mostBorrowed.map((b) => b.bookId);
    const borrowedBooks = await prisma.book.findMany({
      where: { id: { in: bookIds } },
      select: { id: true, title: true, author: true },
    });
    const mostBorrowedBooks = mostBorrowed.map((mb) => ({
      ...borrowedBooks.find((b) => b.id === mb.bookId),
      borrowCount: mb._count.id,
    }));

    const borrowerIds = mostActiveBorrowers.map((b) => b.borrowerId);
    const borrowers = await prisma.borrower.findMany({
      where: { id: { in: borrowerIds } },
    });
    const activeBorrowers = mostActiveBorrowers.map((mb) => ({
      ...borrowers.find((b) => b.id === mb.borrowerId),
      borrowCount: mb._count.id,
    }));

    return NextResponse.json({
      stats: {
        totalTitles,
        totalCopies,
        availableCopies,
        borrowedCopies,
        overdueCopies,
        totalBorrowers,
        booksAddedThisMonth,
        borrowedThisMonth,
      },
      recentTransactions,
      recentReturns,
      overdueBooks,
      mostBorrowedBooks,
      mostActiveBorrowers: activeBorrowers,
      booksByLevel,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
