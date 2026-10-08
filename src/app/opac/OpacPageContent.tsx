"use client";

import { useEffect, useMemo, useState } from "react";
import { Grid3X3, List, RotateCcw, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Select } from "@/components/ui/FormFields";
import { PublicHeader, PublicFooter } from "@/components/public/PublicLayout";
import { OpacBookCard, OpacBookListItem, type OpacBookSummary } from "@/components/public/OpacBookCard";
import { OpacBookGridSkeleton } from "@/components/public/OpacBookGridSkeleton";
import { OpacCategoryCard } from "@/components/public/OpacCategoryCard";
import { SectionHeading } from "@/components/public/SectionHeading";
import { ACADEMIC_LEVELS, COLLECTION_TYPES, labelFor } from "@/lib/constants";
import {
  OPAC_BROWSE_CATEGORIES,
  OPAC_SORT_OPTIONS,
  type OpacBrowseCategory,
  type OpacSortValue,
} from "@/lib/opac-browse";

const PAGE_SIZE = 24;

type OpacPageContentProps = {
  initialQ?: string;
  initialSort?: string;
  initialAcademicLevel?: string;
  initialCollectionType?: string;
};

export default function OpacPageContent({
  initialQ = "",
  initialSort = "",
  initialAcademicLevel = "",
  initialCollectionType = "",
}: OpacPageContentProps) {
  const [search, setSearch] = useState(initialQ);
  const [sort, setSort] = useState<OpacSortValue>(
    (OPAC_SORT_OPTIONS.some((o) => o.value === initialSort) ? initialSort : "title") as OpacSortValue
  );
  const [academicLevel, setAcademicLevel] = useState(initialAcademicLevel);
  const [collectionType, setCollectionType] = useState(initialCollectionType);
  const [availability, setAvailability] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const [books, setBooks] = useState<OpacBookSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [featuredBooks, setFeaturedBooks] = useState<OpacBookSummary[]>([]);
  const [recentBooks, setRecentBooks] = useState<OpacBookSummary[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);

  const isBrowseActive = Boolean(
    search.trim() || academicLevel || collectionType || availability || sort === "newest" || page > 1
  );

  const activeFilterCount = [academicLevel, collectionType, availability].filter(Boolean).length;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/opac/home")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setFeaturedBooks(d.featuredBooks || []);
        setRecentBooks(d.recentBooks || []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingHome(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isBrowseActive) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (academicLevel) params.set("academicLevel", academicLevel);
      if (collectionType) params.set("collectionType", collectionType);
      if (availability) params.set("availability", availability);
      if (sort) params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      fetch(`/api/opac/search?${params}`)
        .then((r) => {
          if (!r.ok) throw new Error("Search failed");
          return r.json();
        })
        .then((d) => {
          if (cancelled) return;
          setBooks(d.books || []);
          setTotal(d.total ?? 0);
        })
        .catch(() => {
          if (!cancelled) {
            setError("Unable to load search results. Please try again.");
            setBooks([]);
            setTotal(0);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, academicLevel, collectionType, availability, sort, page, isBrowseActive]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    if (!search.trim() && !academicLevel && !collectionType) {
      setSort("title");
    }
  }

  function handleCategorySelect(category: OpacBrowseCategory) {
    setSearch("");
    setAvailability("");
    setPage(1);
    setSort("title");
    if (category.filter.academicLevel) {
      setAcademicLevel(category.filter.academicLevel);
      setCollectionType("");
    } else if (category.filter.collectionType) {
      setCollectionType(category.filter.collectionType);
      setAcademicLevel("");
    }
    document.getElementById("opac-results")?.scrollIntoView({ behavior: "smooth" });
  }

  function clearFilters() {
    setSearch("");
    setAcademicLevel("");
    setCollectionType("");
    setAvailability("");
    setSort("title");
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resultsHeading = useMemo(() => {
    if (search.trim()) return `"${search.trim()}"`;
    if (academicLevel) return labelFor(ACADEMIC_LEVELS, academicLevel);
    if (collectionType) return labelFor(COLLECTION_TYPES, collectionType);
    if (sort === "newest") return "New Arrivals";
    return "All Books";
  }, [search, academicLevel, collectionType, sort]);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="opac-hero relative overflow-hidden border-b border-[var(--hmc-blue-border)]">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white shadow-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4" aria-hidden />
              Harris Library Online Public Access Catalog
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
              Discover Your Next Great Read
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg">
              Explore the Harris Library collection and discover books, learning resources, and references for your academic journey.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="mx-auto mt-8 max-w-3xl">
            <label htmlFor="opac-search" className="sr-only">
              Search the library catalog
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--hmc-blue)]" aria-hidden />
                <input
                  id="opac-search"
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Search by title, author, subject, ISBN, or keyword..."
                  className="w-full rounded-xl border border-[var(--hmc-blue-border)] bg-white py-4 pl-12 pr-4 text-base shadow-sm transition focus:border-[var(--hmc-blue)] focus:outline-none focus:ring-4 focus:ring-[var(--hmc-blue-muted)]"
                />
              </div>
              <button
                type="submit"
                className="btn-hmc-primary inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hmc-blue)]"
              >
                <Search className="h-5 w-5" aria-hidden />
                Search
              </button>
            </div>
          </form>

          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                clearFilters();
                setSort("newest");
                setPage(1);
                document.getElementById("opac-results")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full border border-[var(--hmc-blue-border)] bg-white/80 px-3 py-1 text-[var(--hmc-blue)] transition hover:border-[var(--hmc-blue)]/40 hover:bg-white"
            >
              New Arrivals
            </button>
            {OPAC_BROWSE_CATEGORIES.filter((cat) => cat.filter.academicLevel).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className="rounded-full border border-[var(--hmc-blue-border)] bg-white/80 px-3 py-1 text-[var(--hmc-text-muted)] transition hover:border-[var(--hmc-blue)]/40 hover:bg-white hover:text-[var(--hmc-blue)]"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Discovery sections — shown when no active search/filter */}
        {!isBrowseActive && (
          <>
            <section className="mb-14">
              <SectionHeading
                title="Browse by Category"
                description="Explore books organized by academic level and collection type."
              />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {OPAC_BROWSE_CATEGORIES.map((cat) => (
                  <OpacCategoryCard key={cat.id} category={cat} onSelect={handleCategorySelect} />
                ))}
              </div>
            </section>

            {(featuredBooks.length > 0 || loadingHome) && (
              <section className="mb-14">
                <SectionHeading title="Featured Books" description="Popular titles available in the library." />
                <div className="mt-8">
                  {loadingHome ? (
                    <OpacBookGridSkeleton count={4} />
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {featuredBooks.map((book) => (
                        <OpacBookCard key={book.id} book={book} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {(recentBooks.length > 0 || loadingHome) && (
              <section className="mb-14">
                <SectionHeading
                  title="Recently Added to the Collection"
                  description="The latest books added to the Harris Library catalog."
                />
                <div className="mt-8">
                  {loadingHome ? (
                    <OpacBookGridSkeleton count={4} />
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {recentBooks.map((book) => (
                        <OpacBookCard key={book.id} book={book} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* Search results */}
        {isBrowseActive && (
          <section id="opac-results">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--hmc-blue)]">Search Results</h2>
                <p className="mt-1 text-sm text-[var(--hmc-text-muted)]">
                  {loading ? "Searching..." : `${total} result${total !== 1 ? "s" : ""} for ${resultsHeading}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--hmc-blue-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--hmc-blue)] transition hover:bg-[var(--hmc-blue-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hmc-blue)]"
                  aria-expanded={showFilters}
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-[var(--hmc-blue)] px-1.5 py-0.5 text-xs text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <div className="flex rounded-lg border border-[var(--hmc-blue-border)] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-md p-2 ${viewMode === "grid" ? "bg-[var(--hmc-blue-muted)] text-[var(--hmc-blue)]" : "text-[var(--hmc-text-muted)]"}`}
                    aria-label="Grid view"
                    aria-pressed={viewMode === "grid"}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-md p-2 ${viewMode === "list" ? "bg-[var(--hmc-blue-muted)] text-[var(--hmc-blue)]" : "text-[var(--hmc-text-muted)]"}`}
                    aria-label="List view"
                    aria-pressed={viewMode === "list"}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 grid gap-4 rounded-2xl border border-[var(--hmc-blue-border)] bg-[var(--hmc-blue-soft)] p-4 sm:grid-cols-2 lg:grid-cols-4">
                <Select
                  label="Academic Level"
                  value={academicLevel}
                  onChange={(e) => {
                    setPage(1);
                    setAcademicLevel(e.target.value);
                  }}
                  options={[...ACADEMIC_LEVELS]}
                />
                <Select
                  label="Collection Type"
                  value={collectionType}
                  onChange={(e) => {
                    setPage(1);
                    setCollectionType(e.target.value);
                  }}
                  options={[...COLLECTION_TYPES]}
                />
                <Select
                  label="Availability"
                  value={availability}
                  onChange={(e) => {
                    setPage(1);
                    setAvailability(e.target.value);
                  }}
                  options={[
                    { value: "available", label: "Available Only" },
                    { value: "unavailable", label: "Unavailable" },
                  ]}
                />
                <Select
                  label="Sort By"
                  value={sort}
                  onChange={(e) => {
                    setPage(1);
                    setSort(e.target.value as OpacSortValue);
                  }}
                  options={[...OPAC_SORT_OPTIONS]}
                />
              </div>
            )}

            {!showFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Select
                  label="Sort By"
                  value={sort}
                  onChange={(e) => {
                    setPage(1);
                    setSort(e.target.value as OpacSortValue);
                  }}
                  options={[...OPAC_SORT_OPTIONS]}
                />
                {(search || academicLevel || collectionType || availability || sort !== "title") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--hmc-blue)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hmc-blue)]"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            <div className="mt-8">
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
                  <p className="font-medium text-red-800">{error}</p>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p)}
                    className="mt-4 text-sm font-medium text-red-700 underline"
                  >
                    Try again
                  </button>
                </div>
              ) : loading ? (
                <OpacBookGridSkeleton count={8} />
              ) : books.length === 0 ? (
                <div className="rounded-2xl border border-[var(--hmc-blue-border)] bg-[var(--hmc-blue-soft)] px-6 py-16 text-center">
                  <Search className="mx-auto h-12 w-12 text-[var(--hmc-blue)]/25" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--hmc-blue)]">No books found</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-[var(--hmc-text-muted)]">
                    No books found for your search. Try another title, author, subject, or keyword.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-hmc-primary mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Reset Search
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {books.map((book) => (
                    <OpacBookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {books.map((book) => (
                    <OpacBookListItem key={book.id} book={book} />
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && !loading && (
              <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-[var(--hmc-blue-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--hmc-blue)] transition hover:bg-[var(--hmc-blue-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-[var(--hmc-text-muted)]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-[var(--hmc-blue-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--hmc-blue)] transition hover:bg-[var(--hmc-blue-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
