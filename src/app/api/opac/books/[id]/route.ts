import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id, isArchived: false },
      include: {
        category: true,
        copies: {
          include: { location: true },
          where: { status: { not: "ARCHIVED" } },
        },
      },
    });

    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    return NextResponse.json({
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      coAuthor: book.coAuthor,
      isbn: book.isbn,
      publisher: book.publisher,
      placeOfPublication: book.placeOfPublication,
      publicationYear: book.publicationYear,
      edition: book.edition,
      volume: book.volume,
      language: book.language,
      numberOfPages: book.numberOfPages,
      description: book.description,
      note: book.note,
      seriesName: book.seriesName,
      seriesNumber: book.seriesNumber,
      callNumber: book.callNumber,
      ddc: book.ddc,
      lcClassification: book.lcClassification,
      subject: book.subject,
      category: book.category?.name,
      collectionType: book.collectionType,
      academicLevel: book.academicLevel,
      coverImageUrl: book.coverImageUrl,
      totalCopies: book.copies.length,
      availableCopies: book.copies.filter((c) => c.status === "AVAILABLE").length,
      copies: book.copies.map((c) => ({
        accessionNumber: c.accessionNumber,
        location: c.location?.name,
        status: c.status,
        condition: c.condition,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 });
  }
}
