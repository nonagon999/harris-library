import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { syncOverdueStatuses, daysOverdue } from "@/lib/circulation";
import { getDateRange } from "@/lib/date-filters";
import { getBorrowerDisplayId, getBorrowerFullName } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await syncOverdueStatuses();

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || "summary";
    const preset = (searchParams.get("preset") || "all") as Parameters<typeof getDateRange>[0];
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const limit = parseInt(searchParams.get("limit") || "10");
    const academicLevel = searchParams.get("academicLevel") || "";
    const categoryId = searchParams.get("categoryId") || "";

    const { start, end } = getDateRange(preset, startDate, endDate);
    const dateFilter = start || end ? { gte: start ?? undefined, lte: end ?? undefined } : undefined;

    if (type === "summary") {
      const [
        totalBooks,
        totalCopies,
        availableCopies,
        borrowedCopies,
        overdueCount,
        lostCopies,
        damagedCopies,
        totalBorrowers,
        totalTransactions,
        totalReturned,
        currentlyBorrowed,
        currentlyOverdue,
      ] = await Promise.all([
        prisma.book.count({ where: { isArchived: false } }),
        prisma.bookCopy.count(),
        prisma.bookCopy.count({ where: { status: "AVAILABLE" } }),
        prisma.bookCopy.count({ where: { status: { in: ["BORROWED", "RENEWED"] } } }),
        prisma.borrowingTransaction.count({ where: { status: "OVERDUE", returnDate: null } }),
        prisma.bookCopy.count({ where: { status: "LOST" } }),
        prisma.bookCopy.count({ where: { status: "DAMAGED" } }),
        prisma.borrower.count({ where: { status: "ACTIVE" } }),
        prisma.borrowingTransaction.count(
          dateFilter ? { where: { borrowDate: dateFilter } } : undefined
        ),
        prisma.borrowingTransaction.count({
          where: { status: "RETURNED", ...(dateFilter ? { returnDate: dateFilter } : {}) },
        }),
        prisma.borrowingTransaction.count({ where: { returnDate: null, status: { in: ["BORROWED", "RENEWED"] } } }),
        prisma.borrowingTransaction.count({ where: { status: "OVERDUE", returnDate: null } }),
      ]);

      const booksByCategory = await prisma.book.groupBy({
        by: ["categoryId"],
        _count: { id: true },
        where: { isArchived: false },
      });
      const categories = await prisma.category.findMany();
      const categoryReport = booksByCategory.map((b) => ({
        category: categories.find((c) => c.id === b.categoryId)?.name || "Uncategorized",
        count: b._count.id,
      }));

      const booksByLevel = await prisma.book.groupBy({
        by: ["academicLevel"],
        _count: { id: true },
        where: { isArchived: false },
      });

      const copyStatusBreakdown = await prisma.bookCopy.groupBy({
        by: ["status"],
        _count: { id: true },
      });

      return NextResponse.json({
        summary: {
          totalBooks,
          totalCopies,
          availableCopies,
          borrowedCopies,
          overdueCount,
          lostCopies,
          damagedCopies,
          totalBorrowers,
          totalTransactions,
          totalReturned,
          currentlyBorrowed,
          currentlyOverdue,
        },
        booksByCategory: categoryReport,
        booksByLevel,
        copyStatusBreakdown,
      });
    }

    if (type === "books-added") {
      const books = await prisma.book.findMany({
        where: {
          ...(dateFilter ? { createdAt: dateFilter } : {}),
          ...(academicLevel ? { academicLevel } : {}),
          ...(categoryId ? { categoryId } : {}),
        },
        include: {
          category: true,
          addedBy: { select: { firstName: true, lastName: true } },
          _count: { select: { copies: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({
        count: books.length,
        books: books.map((b) => ({
          title: b.title,
          author: b.author,
          isbn: b.isbn,
          category: b.category?.name,
          dateAdded: b.createdAt,
          copies: b._count.copies,
          addedBy: b.addedBy ? `${b.addedBy.firstName} ${b.addedBy.lastName}` : "—",
        })),
      });
    }

    if (type === "borrowing") {
      const transactions = await prisma.borrowingTransaction.findMany({
        where: dateFilter ? { borrowDate: dateFilter } : {},
        include: { borrower: true, book: true, bookCopy: true },
        orderBy: { borrowDate: "desc" },
      });

      const summary = {
        totalBorrowed: transactions.length,
        totalReturned: transactions.filter((t) => t.returnDate).length,
        currentlyBorrowed: transactions.filter((t) => !t.returnDate).length,
        currentlyOverdue: transactions.filter((t) => t.status === "OVERDUE" && !t.returnDate).length,
      };

      return NextResponse.json({
        summary,
        transactions: transactions.map((t) => ({
          bookTitle: t.book.title,
          borrowerName: getBorrowerFullName(t.borrower),
          borrowerId: getBorrowerDisplayId(t.borrower),
          borrowDate: t.borrowDate,
          dueDate: t.dueDate,
          returnDate: t.returnDate,
          status: t.status,
          accessionNumber: t.bookCopy.accessionNumber,
        })),
      });
    }

    if (type === "most-borrowed") {
      const where = dateFilter ? { borrowDate: dateFilter } : {};
      const grouped = await prisma.borrowingTransaction.groupBy({
        by: ["bookId"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        ...(limit > 0 ? { take: limit } : {}),
      });

      const books = await prisma.book.findMany({
        where: { id: { in: grouped.map((g) => g.bookId) } },
        include: { copies: { where: { status: "AVAILABLE" } } },
      });

      return NextResponse.json({
        books: grouped.map((g, i) => {
          const book = books.find((b) => b.id === g.bookId);
          return {
            rank: i + 1,
            title: book?.title,
            author: book?.author,
            timesBorrowed: g._count.id,
            availableCopies: book?.copies.length ?? 0,
          };
        }),
      });
    }

    if (type === "most-active-borrowers") {
      const where = dateFilter ? { borrowDate: dateFilter } : {};
      const grouped = await prisma.borrowingTransaction.groupBy({
        by: ["borrowerId"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: limit,
      });

      const borrowers = await prisma.borrower.findMany({
        where: { id: { in: grouped.map((g) => g.borrowerId) } },
      });

      const result = await Promise.all(
        grouped.map(async (g, i) => {
          const borrower = borrowers.find((b) => b.id === g.borrowerId);
          const currentlyBorrowed = await prisma.borrowingTransaction.count({
            where: { borrowerId: g.borrowerId, returnDate: null },
          });
          const returned = await prisma.borrowingTransaction.count({
            where: { borrowerId: g.borrowerId, status: "RETURNED", ...(dateFilter ? { returnDate: dateFilter } : {}) },
          });
          return {
            rank: i + 1,
            name: borrower ? getBorrowerFullName(borrower) : "Unknown",
            borrowerId: borrower ? getBorrowerDisplayId(borrower) : "",
            academicLevel: borrower?.academicLevel,
            department: borrower?.department,
            totalBorrowed: g._count.id,
            currentlyBorrowed,
            returned,
          };
        })
      );

      return NextResponse.json({ borrowers: result });
    }

    if (type === "overdue") {
      const overdue = await prisma.borrowingTransaction.findMany({
        where: { status: "OVERDUE", returnDate: null },
        include: { borrower: true, book: true, bookCopy: true },
        orderBy: { dueDate: "asc" },
      });

      return NextResponse.json({
        count: overdue.length,
        books: overdue.map((t) => ({
          bookTitle: t.book.title,
          borrowerName: getBorrowerFullName(t.borrower),
          borrowerId: getBorrowerDisplayId(t.borrower),
          borrowDate: t.borrowDate,
          dueDate: t.dueDate,
          daysOverdue: daysOverdue(t.dueDate),
          accessionNumber: t.bookCopy.accessionNumber,
          status: t.status,
        })),
      });
    }

    if (type === "monthly-borrowing") {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      const transactions = await prisma.borrowingTransaction.findMany({
        where: { borrowDate: { gte: start, lte: end } },
        select: { borrowDate: true },
      });

      const months = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(year, i, 1).toLocaleString("en-US", { month: "long" }),
        count: 0,
      }));

      transactions.forEach((t) => {
        months[t.borrowDate.getMonth()].count++;
      });

      return NextResponse.json({ year, data: months });
    }

    if (type === "monthly-books-added") {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      const books = await prisma.book.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      });

      const months = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(year, i, 1).toLocaleString("en-US", { month: "long" }),
        count: 0,
      }));

      books.forEach((b) => {
        months[b.createdAt.getMonth()].count++;
      });

      return NextResponse.json({ year, data: months });
    }

    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
