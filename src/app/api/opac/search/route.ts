import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { classificationSearchFilters } from "@/lib/classification";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("q") || searchParams.get("search") || "";
    const academicLevel = searchParams.get("academicLevel") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const collectionType = searchParams.get("collectionType") || "";
    const availability = searchParams.get("availability") || "";
    const publicationYear = searchParams.get("publicationYear") || "";
    const locationId = searchParams.get("locationId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");
    const sort = searchParams.get("sort") || "title";

    const orderBy =
      sort === "newest"
        ? { createdAt: "desc" as const }
        : sort === "author"
          ? { author: "asc" as const }
          : { title: "asc" as const };

    const where = {
      isArchived: false,
      ...(academicLevel ? { academicLevel } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(collectionType ? { collectionType } : {}),
      ...(publicationYear ? { publicationYear: parseInt(publicationYear) } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { author: { contains: search, mode: "insensitive" as const } },
              { editor: { contains: search, mode: "insensitive" as const } },
              { isbn: { contains: search, mode: "insensitive" as const } },
              { subject: { contains: search, mode: "insensitive" as const } },
              { callNumber: { contains: search, mode: "insensitive" as const } },
              ...classificationSearchFilters(search),
              { publisher: { contains: search, mode: "insensitive" as const } },
              { seriesName: { contains: search, mode: "insensitive" as const } },
              { copies: { some: { accessionNumber: { contains: search, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
      ...(locationId ? { copies: { some: { locationId } } } : {}),
    };

    let books = await prisma.book.findMany({
      where,
      include: {
        category: true,
        copies: { include: { location: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    if (availability === "available") {
      books = books.filter((b) => b.copies.some((c) => c.status === "AVAILABLE"));
    } else if (availability === "unavailable") {
      books = books.filter((b) => !b.copies.some((c) => c.status === "AVAILABLE"));
    }

    const total = await prisma.book.count({ where });

    const results = books.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      subject: book.subject,
      category: book.category?.name,
      callNumber: book.callNumber,
      academicLevel: book.academicLevel,
      collectionType: book.collectionType,
      publicationYear: book.publicationYear,
      coverImageUrl: book.coverImageUrl,
      totalCopies: book.copies.length,
      availableCopies: book.copies.filter((c) => c.status === "AVAILABLE").length,
    }));

    return NextResponse.json({ books: results, total, page, limit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
