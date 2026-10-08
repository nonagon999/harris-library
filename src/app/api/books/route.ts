import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { classificationSearchFilters } from "@/lib/classification";
import { bookFormSchema, formatZodErrors, toHarrisBibliographicInput } from "@/lib/marc/validation";
import { syncMarcFromHarrisInput } from "@/lib/marc/service";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const academicLevel = searchParams.get("academicLevel") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const collectionType = searchParams.get("collectionType") || "";
    const includeArchived = searchParams.get("includeArchived") === "true";

    const where = {
      ...(includeArchived ? {} : { isArchived: false }),
      ...(academicLevel ? { academicLevel } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(collectionType ? { collectionType } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { author: { contains: search, mode: "insensitive" as const } },
              { isbn: { contains: search, mode: "insensitive" as const } },
              { callNumber: { contains: search, mode: "insensitive" as const } },
              ...classificationSearchFilters(search),
              { subject: { contains: search, mode: "insensitive" as const } },
              { publisher: { contains: search, mode: "insensitive" as const } },
              { seriesName: { contains: search, mode: "insensitive" as const } },
              { copies: { some: { accessionNumber: { contains: search, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          category: true,
          copies: { include: { location: true } },
          _count: { select: { copies: true } },
          marcRecord: { select: { id: true, controlNumber001: true } },
        },
        orderBy: { title: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.book.count({ where }),
    ]);

    const booksWithAvailability = books.map((book) => ({
      ...book,
      totalCopies: book._count.copies,
      availableCopies: book.copies.filter((c) => c.status === "AVAILABLE").length,
    }));

    return NextResponse.json({ books: booksWithAvailability, total, page, limit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = bookFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", fields: formatZodErrors(parsed.error) }, { status: 400 });
    }

    const data = parsed.data;
    const harrisInput = toHarrisBibliographicInput(data);

    const existingCopy = await prisma.bookCopy.findUnique({
      where: { accessionNumber: data.accessionNumber.trim() },
    });
    if (existingCopy) {
      return NextResponse.json({ error: "Accession Number already exists.", fields: { accessionNumber: "Accession Number already exists." } }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          title: data.title.trim(),
          subtitle: data.subtitle?.trim() || null,
          author: data.author?.trim() || "",
          editor: data.editor?.trim() || null,
          isbn: data.isbn?.trim() || null,
          publisher: data.publisher.trim(),
          placeOfPublication: data.placeOfPublication.trim(),
          publicationYear: data.copyright,
          edition: data.edition?.trim() || null,
          numberOfPages: data.pages,
          illustration: data.illustration?.trim() || null,
          seriesName: data.seriesName?.trim() || null,
          seriesNumber: data.seriesNumber?.trim() || null,
          note: data.note?.trim() || null,
          description: data.note?.trim() || data.description?.trim() || null,
          callNumber: data.callNumber.trim(),
          ddc: data.ddc?.trim() || null,
          lcClassification: data.lcClassification?.trim() || null,
          subject: data.subject?.trim() || null,
          categoryId: data.categoryId || null,
          collectionType: data.collectionType || "GENERAL_COLLECTION",
          academicLevel: data.academicLevel || "GENERAL",
          coverImageUrl: body.coverImageUrl?.trim() || null,
          addedById: user.id,
          updatedById: user.id,
        },
      });

      await tx.bookCopy.create({
        data: {
          bookId: book.id,
          accessionNumber: data.accessionNumber.trim(),
          locationId: data.locationId || null,
          status: "AVAILABLE",
        },
      });

      return book;
    });

    await syncMarcFromHarrisInput(result.id, harrisInput);

    await logAudit({
      userId: user.id,
      action: "Added Book",
      module: "Books",
      recordId: result.id,
      details: result.title,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
