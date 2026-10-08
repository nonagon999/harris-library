import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  exportAllBooksMarc21,
  exportBookAsMarc21,
  exportBookAsMarcxml,
  exportBooksAsMarc21,
  exportBooksAsMarcxml,
} from "@/lib/marc/exporter";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;
    const format = (searchParams.get("format") || "marc21").toLowerCase();
    const bookId = searchParams.get("bookId");
    const bookIds = searchParams.get("bookIds")?.split(",").filter(Boolean);

    let content: string;
    let filename: string;

    if (bookId) {
      content = format === "marcxml"
        ? await exportBookAsMarcxml(bookId)
        : await exportBookAsMarc21(bookId);
      filename = `book-${bookId}.${format === "marcxml" ? "xml" : "mrc"}`;
    } else if (bookIds?.length) {
      content = format === "marcxml"
        ? await exportBooksAsMarcxml(bookIds)
        : await exportBooksAsMarc21(bookIds);
      filename = `harris-export.${format === "marcxml" ? "xml" : "mrc"}`;
    } else {
      content = format === "marcxml"
        ? await exportBooksAsMarcxml([]) // fallback handled below
        : await exportAllBooksMarc21();
      if (format === "marcxml") {
        const { prisma } = await import("@/lib/prisma");
        const books = await prisma.book.findMany({ where: { isArchived: false }, select: { id: true } });
        content = await exportBooksAsMarcxml(books.map((b) => b.id));
      }
      filename = `harris-catalog.${format === "marcxml" ? "xml" : "mrc"}`;
    }

    const contentType = format === "marcxml" ? "application/xml" : "application/marc";

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
