import { prisma } from "@/lib/prisma";
import type { DuplicateMatch } from "./types";

type DuplicateInput = {
  isbn?: string | null;
  accessionNumber?: string | null;
  controlNumber001?: string | null;
  title?: string | null;
  author?: string | null;
  callNumber?: string | null;
};

type BookRef = { id: string; title: string };

export type DuplicateIndex = {
  isbn: Map<string, BookRef>;
  accession: Map<string, BookRef>;
  control001: Map<string, BookRef>;
  callNumber: Map<string, BookRef>;
  titleAuthor: Map<string, BookRef>;
};

function titleAuthorKey(title: string, author: string) {
  return `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
}

/** Load catalog identifiers once — used for bulk MARC import preview (avoids N×5 DB queries). */
export async function buildDuplicateIndex(): Promise<DuplicateIndex> {
  const [books, copies, marcs] = await Promise.all([
    prisma.book.findMany({
      where: { isArchived: false },
      select: { id: true, title: true, author: true, isbn: true, callNumber: true },
    }),
    prisma.bookCopy.findMany({
      select: {
        accessionNumber: true,
        book: { select: { id: true, title: true, isArchived: true } },
      },
    }),
    prisma.marcRecord.findMany({
      where: { controlNumber001: { not: null } },
      select: {
        controlNumber001: true,
        book: { select: { id: true, title: true, isArchived: true } },
      },
    }),
  ]);

  const index: DuplicateIndex = {
    isbn: new Map(),
    accession: new Map(),
    control001: new Map(),
    callNumber: new Map(),
    titleAuthor: new Map(),
  };

  for (const book of books) {
    if (book.isbn?.trim()) index.isbn.set(book.isbn.trim(), { id: book.id, title: book.title });
    if (book.callNumber?.trim()) index.callNumber.set(book.callNumber.trim(), { id: book.id, title: book.title });
    if (book.title?.trim() && book.author?.trim()) {
      index.titleAuthor.set(titleAuthorKey(book.title, book.author), { id: book.id, title: book.title });
    }
  }

  for (const copy of copies) {
    if (copy.book.isArchived) continue;
    index.accession.set(copy.accessionNumber, { id: copy.book.id, title: copy.book.title });
  }

  for (const marc of marcs) {
    if (marc.book.isArchived || !marc.controlNumber001?.trim()) continue;
    index.control001.set(marc.controlNumber001.trim(), { id: marc.book.id, title: marc.book.title });
  }

  return index;
}

export function findDuplicateMatchesFromIndex(input: DuplicateInput, index: DuplicateIndex): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const seen = new Set<string>();

  function add(book: BookRef, reason: string) {
    if (seen.has(book.id)) return;
    seen.add(book.id);
    matches.push({ bookId: book.id, title: book.title, reason });
  }

  if (input.isbn?.trim()) {
    const book = index.isbn.get(input.isbn.trim());
    if (book) add(book, "ISBN match");
  }

  if (input.accessionNumber?.trim()) {
    const book = index.accession.get(input.accessionNumber.trim());
    if (book) add(book, "Accession Number match");
  }

  if (input.controlNumber001?.trim()) {
    const book = index.control001.get(input.controlNumber001.trim());
    if (book) add(book, "MARC 001 Control Number match");
  }

  if (input.callNumber?.trim()) {
    const book = index.callNumber.get(input.callNumber.trim());
    if (book) add(book, "Call Number match");
  }

  if (input.title?.trim() && input.author?.trim()) {
    const book = index.titleAuthor.get(titleAuthorKey(input.title, input.author));
    if (book) add(book, "Title + Author match");
  }

  return matches;
}

/** Register a newly created book so later records in the same batch detect it. */
export function registerBookInIndex(
  index: DuplicateIndex,
  book: { id: string; title: string; author: string; isbn?: string | null; callNumber?: string | null },
  extras?: { accessionNumber?: string; controlNumber001?: string | null }
) {
  if (book.isbn?.trim()) index.isbn.set(book.isbn.trim(), { id: book.id, title: book.title });
  if (book.callNumber?.trim()) index.callNumber.set(book.callNumber.trim(), { id: book.id, title: book.title });
  if (book.title?.trim() && book.author?.trim()) {
    index.titleAuthor.set(titleAuthorKey(book.title, book.author), { id: book.id, title: book.title });
  }
  if (extras?.accessionNumber) {
    index.accession.set(extras.accessionNumber, { id: book.id, title: book.title });
  }
  if (extras?.controlNumber001?.trim()) {
    index.control001.set(extras.controlNumber001.trim(), { id: book.id, title: book.title });
  }
}

/** Legacy per-record lookup (single imports). */
export async function findDuplicateMatches(input: DuplicateInput): Promise<DuplicateMatch[]> {
  const index = await buildDuplicateIndex();
  return findDuplicateMatchesFromIndex(input, index);
}
