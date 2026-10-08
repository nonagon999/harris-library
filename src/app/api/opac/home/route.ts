import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapBook(book: {
  id: string;
  title: string;
  author: string;
  academicLevel: string;
  coverImageUrl: string | null;
  category: { name: string } | null;
  copies: { status: string }[];
}) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    academicLevel: book.academicLevel,
    coverImageUrl: book.coverImageUrl,
    category: book.category?.name ?? null,
    totalCopies: book.copies.length,
    availableCopies: book.copies.filter((c) => c.status === "AVAILABLE").length,
  };
}

export async function GET() {
  try {
    const [recentBooks, featuredBooks, settings] = await Promise.all([
      prisma.book.findMany({
        where: { isArchived: false },
        include: { category: true, copies: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.book.findMany({
        where: { isArchived: false },
        include: { category: true, copies: true },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      prisma.librarySetting.findFirst(),
    ]);

    const featured = featuredBooks
      .filter((b) => b.copies.some((c) => c.status === "AVAILABLE"))
      .slice(0, 6)
      .map(mapBook);

    return NextResponse.json({
      recentBooks: recentBooks.map(mapBook),
      featuredBooks: featured,
      libraryInfo: settings
        ? {
            schoolName: settings.schoolName,
            libraryName: settings.libraryName,
            academicYear: settings.academicYear,
            contactEmail: settings.contactEmail,
            contactPhone: settings.contactPhone,
            address: settings.address,
            borrowingPeriodDays: settings.borrowingPeriodDays,
            maxBooksAllowed: settings.maxBooksAllowed,
          }
        : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load homepage data" }, { status: 500 });
  }
}
