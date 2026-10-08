import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { OpacBookCover } from "@/components/public/OpacBookCover";
import { labelFor, ACADEMIC_LEVELS } from "@/lib/constants";

export type OpacBookSummary = {
  id: string;
  title: string;
  author: string;
  academicLevel: string;
  availableCopies: number;
  totalCopies: number;
  coverImageUrl?: string | null;
  category?: string | null;
  publicationYear?: number | null;
  callNumber?: string | null;
  publisher?: string | null;
  collectionType?: string;
};

export function OpacBookCard({ book }: { book: OpacBookSummary }) {
  const available = book.availableCopies > 0;
  const metaLine = [
    book.publicationYear ? String(book.publicationYear) : null,
    book.publisher,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="opac-book-card group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--hmc-blue-border)] bg-white shadow-[var(--hmc-shadow-sm)]">
      <Link href={`/opac/books/${book.id}`} className="flex flex-1 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hmc-blue)]">
        <div className="p-3 pb-0">
          <OpacBookCover title={book.title} coverImageUrl={book.coverImageUrl} />
        </div>
        <div className="flex flex-1 flex-col p-4 pt-3">
          <h3 className="line-clamp-2 font-semibold leading-snug text-[var(--hmc-blue)] group-hover:text-[var(--hmc-blue-dark)]">
            {book.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-[var(--hmc-text-muted)]">
            {book.author || "Unknown author"}
          </p>
          {metaLine && (
            <p className="mt-1 line-clamp-1 text-xs text-[var(--hmc-text-muted)]">{metaLine}</p>
          )}
          {book.callNumber && (
            <p className="mt-1 line-clamp-1 font-mono text-xs text-[var(--hmc-text-muted)]">
              {book.callNumber}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
            <span className="rounded-full bg-[var(--hmc-blue-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--hmc-blue)]">
              {labelFor(ACADEMIC_LEVELS, book.academicLevel)}
            </span>
            <StatusBadge status={available ? "AVAILABLE" : "BORROWED"} />
          </div>
        </div>
      </Link>
      <div className="border-t border-[var(--hmc-blue-border)] px-4 py-3">
        <Link
          href={`/opac/books/${book.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hmc-blue)] transition hover:text-[var(--hmc-blue-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hmc-blue)]"
        >
          View Details
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

/** Compact horizontal card for list view */
export function OpacBookListItem({ book }: { book: OpacBookSummary }) {
  const available = book.availableCopies > 0;

  return (
    <article className="opac-book-card group flex gap-4 rounded-2xl border border-[var(--hmc-blue-border)] bg-white p-4 shadow-[var(--hmc-shadow-sm)]">
      <Link href={`/opac/books/${book.id}`} className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hmc-blue)]">
        <OpacBookCover title={book.title} coverImageUrl={book.coverImageUrl} size="sm" className="h-28 w-20" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/opac/books/${book.id}`}>
          <h3 className="font-semibold text-[var(--hmc-blue)] group-hover:text-[var(--hmc-blue-dark)]">{book.title}</h3>
        </Link>
        <p className="mt-0.5 text-sm text-[var(--hmc-text-muted)]">{book.author}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={available ? "AVAILABLE" : "BORROWED"} />
          {book.callNumber && (
            <span className="font-mono text-xs text-[var(--hmc-text-muted)]">{book.callNumber}</span>
          )}
        </div>
      </div>
      <Link
        href={`/opac/books/${book.id}`}
        className="hidden shrink-0 self-center text-sm font-medium text-[var(--hmc-blue)] sm:inline-flex"
      >
        View Details →
      </Link>
    </article>
  );
}
