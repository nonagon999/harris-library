import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { bookEditFormSchema, formatZodErrors, toHarrisBibliographicInput } from "@/lib/marc/validation";
import { mergeMarcFromHarrisInput } from "@/lib/marc/service";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
        addedBy: { select: { firstName: true, lastName: true } },
        updatedBy: { select: { firstName: true, lastName: true } },
        copies: { include: { location: true }, orderBy: { accessionNumber: "asc" } },
      },
    });
    if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
    return NextResponse.json(book);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.book.findUnique({
      where: { id },
      include: { copies: { orderBy: { accessionNumber: "asc" }, take: 1 } },
    });
    if (!existing) return NextResponse.json({ error: "Book not found" }, { status: 404 });

    if (body.isArchived === true && body.title === undefined) {
      const book = await prisma.book.update({
        where: { id },
        data: { isArchived: true, updatedById: user.id },
      });

      await logAudit({
        userId: user.id,
        action: "Archived Book",
        module: "Books",
        recordId: book.id,
        details: book.title,
      });

      return NextResponse.json(book);
    }

    const parsed = bookEditFormSchema.safeParse({
      title: body.title ?? existing.title,
      author: body.author ?? existing.author,
      editor: body.editor ?? existing.editor,
      edition: body.edition ?? existing.edition,
      placeOfPublication: body.placeOfPublication ?? existing.placeOfPublication ?? "",
      publisher: body.publisher ?? existing.publisher ?? "",
      copyright: body.copyright ?? body.publicationYear ?? existing.publicationYear ?? new Date().getFullYear(),
      pages: body.pages ?? body.numberOfPages ?? existing.numberOfPages ?? 1,
      illustration: body.illustration ?? existing.illustration,
      seriesName: body.seriesName ?? existing.seriesName,
      seriesNumber: body.seriesNumber ?? existing.seriesNumber,
      note: body.note ?? existing.note,
      isbn: body.isbn ?? existing.isbn,
      callNumber: body.callNumber ?? existing.callNumber ?? "",
      subtitle: body.subtitle ?? existing.subtitle,
      subject: body.subject ?? existing.subject,
      ddc: body.ddc !== undefined ? body.ddc : existing.ddc,
      lcClassification: body.lcClassification !== undefined ? body.lcClassification : existing.lcClassification,
      categoryId: body.categoryId ?? existing.categoryId,
      collectionType: body.collectionType ?? existing.collectionType,
      academicLevel: body.academicLevel ?? existing.academicLevel,
      description: body.description ?? existing.description,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", fields: formatZodErrors(parsed.error) }, { status: 400 });
    }

    const data = parsed.data;
    const accessionNumber = existing.copies[0]?.accessionNumber || "UNKNOWN";
    const coverImageUrl =
      body.coverImageUrl === ""
        ? null
        : body.coverImageUrl !== undefined
          ? body.coverImageUrl?.trim() || null
          : existing.coverImageUrl;

    const book = await prisma.book.update({
      where: { id },
      data: {
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || null,
        author: data.author?.trim() || "",
        editor: data.editor?.trim() || null,
        edition: data.edition?.trim() || null,
        isbn: data.isbn?.trim() || null,
        publisher: data.publisher.trim(),
        placeOfPublication: data.placeOfPublication.trim(),
        publicationYear: data.copyright,
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
        coverImageUrl,
        isArchived: body.isArchived ?? existing.isArchived,
        updatedById: user.id,
      },
      include: {
        updatedBy: { select: { firstName: true, lastName: true } },
      },
    });

    await mergeMarcFromHarrisInput(book.id, {
      ...toHarrisBibliographicInput({ ...data, accessionNumber, locationId: null }),
    });

    await logAudit({
      userId: user.id,
      action: body.isArchived ? "Archived Book" : "Updated Book",
      module: "Books",
      recordId: book.id,
      details: book.title,
    });

    return NextResponse.json(book);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}
