"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { PublicHeader, PublicFooter } from "@/components/public/PublicLayout";
import { OpacBookCover } from "@/components/public/OpacBookCover";
import { SCHOOL_NAME, LIBRARY_NAME, labelFor, ACADEMIC_LEVELS, COLLECTION_TYPES } from "@/lib/constants";

type OpacBookDetail = {
  id: string;
  title: string;
  subtitle?: string | null;
  author: string;
  coAuthor?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  placeOfPublication?: string | null;
  publicationYear?: number | null;
  edition?: string | null;
  volume?: string | null;
  language?: string;
  numberOfPages?: number | null;
  description?: string | null;
  note?: string | null;
  callNumber?: string | null;
  ddc?: string | null;
  lcClassification?: string | null;
  subject?: string | null;
  category?: string | null;
  collectionType?: string;
  academicLevel?: string;
  seriesName?: string | null;
  seriesNumber?: string | null;
  coverImageUrl?: string | null;
  totalCopies?: number;
  availableCopies?: number;
  copies?: { accessionNumber: string; location?: string | null; status: string; condition?: string }[];
  error?: string;
};

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading book details">
      <div className="opac-skeleton mb-6 h-8 w-48 rounded" />
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="opac-skeleton aspect-[2/3] w-full max-w-[240px] rounded-xl" />
        <div className="space-y-4">
          <div className="opac-skeleton h-10 w-3/4 rounded" />
          <div className="opac-skeleton h-6 w-1/2 rounded" />
          <div className="opac-skeleton h-24 w-full rounded" />
        </div>
      </div>
    </div>
  );
}

function BibRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="grid gap-1 border-b border-[var(--hmc-blue-border)] py-3 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-[var(--hmc-text-muted)]">{label}</dt>
      <dd className="text-sm font-medium text-[var(--foreground)]">{String(value)}</dd>
    </div>
  );
}

export default function OpacBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [book, setBook] = useState<OpacBookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      fetch(`/api/opac/books/${id}`)
        .then((r) => r.json())
        .then((data: OpacBookDetail) => {
          if (cancelled) return;
          if (data.error) {
            setError(data.error);
            setBook(null);
          } else {
            setBook(data);
          }
        })
        .catch(() => {
          if (!cancelled) setError("Unable to load book details.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[var(--hmc-blue-soft)]">
      <PublicHeader />

      <div className="border-b border-[var(--hmc-blue-border)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/opac"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--hmc-blue)] transition hover:bg-[var(--hmc-blue-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hmc-blue)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Search
          </Link>
        </div>
      </div>

      {loading ? (
        <DetailSkeleton />
      ) : error || !book ? (
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-[var(--hmc-blue)]/30" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold text-[var(--hmc-blue)]">{error || "Book not found"}</h1>
          <Link href="/opac" className="mt-4 inline-block text-sm font-medium text-[var(--hmc-blue)] hover:underline">
            Return to catalog search
          </Link>
        </div>
      ) : (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--hmc-text-muted)]">{SCHOOL_NAME}</p>
          <p className="text-sm font-semibold text-[var(--hmc-blue)]">{LIBRARY_NAME}</p>

          <div className="mt-6 grid gap-8 rounded-2xl border border-[var(--hmc-blue-border)] bg-white p-6 shadow-[var(--hmc-shadow-sm)] sm:p-8 lg:grid-cols-[220px_1fr] lg:gap-10">
            <div className="mx-auto w-full max-w-[220px] lg:mx-0">
              <OpacBookCover title={book.title} coverImageUrl={book.coverImageUrl} size="lg" className="shadow-md" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight text-[var(--hmc-blue)] sm:text-3xl">{book.title}</h1>
              {book.subtitle && (
                <p className="mt-1 text-lg text-[var(--hmc-text-muted)]">{book.subtitle}</p>
              )}
              <p className="mt-3 text-lg text-[var(--foreground)]">
                by {book.author}
                {book.coAuthor ? `; ${book.coAuthor}` : ""}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge status={(book.availableCopies ?? 0) > 0 ? "AVAILABLE" : "BORROWED"} />
                <span className="rounded-full bg-[var(--hmc-blue-muted)] px-3 py-1 text-xs font-medium text-[var(--hmc-blue)]">
                  {book.availableCopies ?? 0} of {book.totalCopies ?? 0} copies available
                </span>
                {book.academicLevel && (
                  <span className="rounded-full bg-[var(--hmc-blue-soft)] px-3 py-1 text-xs font-medium text-[var(--hmc-text-muted)]">
                    {labelFor(ACADEMIC_LEVELS, book.academicLevel)}
                  </span>
                )}
              </div>

              {(book.description || book.note) && (
                <div className="mt-6 rounded-xl bg-[var(--hmc-blue-soft)] p-4">
                  <h2 className="text-sm font-semibold text-[var(--hmc-blue)]">About this book</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--hmc-text-muted)]">
                    {book.description || book.note}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <section className="rounded-2xl border border-[var(--hmc-blue-border)] bg-white p-6 shadow-[var(--hmc-shadow-sm)]">
              <h2 className="text-lg font-semibold text-[var(--hmc-blue)]">Bibliographic Information</h2>
              <dl className="mt-2">
                <BibRow label="ISBN" value={book.isbn} />
                <BibRow label="Publisher" value={book.publisher} />
                <BibRow label="Place of Publication" value={book.placeOfPublication} />
                <BibRow label="Publication Year" value={book.publicationYear} />
                <BibRow label="Edition" value={book.edition} />
                <BibRow label="Volume" value={book.volume} />
                <BibRow label="Pages" value={book.numberOfPages} />
                <BibRow label="Language" value={book.language} />
                <BibRow label="Series" value={book.seriesName ? `${book.seriesName}${book.seriesNumber ? ` ${book.seriesNumber}` : ""}` : null} />
                <BibRow label="Subject" value={book.subject} />
                <BibRow label="Category" value={book.category} />
                <BibRow label="Collection" value={book.collectionType ? labelFor(COLLECTION_TYPES, book.collectionType) : null} />
              </dl>
            </section>

            <section className="rounded-2xl border border-[var(--hmc-blue-border)] bg-white p-6 shadow-[var(--hmc-shadow-sm)]">
              <h2 className="text-lg font-semibold text-[var(--hmc-blue)]">Classification & Location</h2>
              <dl className="mt-2">
                <BibRow label="Call Number" value={book.callNumber} />
                <BibRow label="DDC" value={book.ddc} />
                <BibRow label="LC Classification" value={book.lcClassification} />
              </dl>
            </section>
          </div>

          {(book.copies?.length ?? 0) > 0 && (
            <section className="mt-8 rounded-2xl border border-[var(--hmc-blue-border)] bg-white p-6 shadow-[var(--hmc-shadow-sm)]">
              <h2 className="text-lg font-semibold text-[var(--hmc-blue)]">Copy Availability</h2>
              <p className="mt-1 text-sm text-[var(--hmc-text-muted)]">
                Physical copies in the Harris Library collection
              </p>
              <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--hmc-blue-border)]">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-[var(--hmc-blue-muted)]">
                    <tr className="text-left text-[var(--hmc-blue)]">
                      <th className="px-4 py-3 font-semibold">Accession #</th>
                      <th className="px-4 py-3 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          Location
                        </span>
                      </th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {book.copies!.map((c) => (
                      <tr key={c.accessionNumber} className="border-t border-[var(--hmc-blue-border)]">
                        <td className="px-4 py-3 font-mono">{c.accessionNumber}</td>
                        <td className="px-4 py-3">{c.location || "—"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      )}

      <PublicFooter />
    </div>
  );
}
