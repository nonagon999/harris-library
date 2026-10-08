"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, Card, LoadingSpinner, EmptyState } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormFields";
import { StatusBadge } from "@/components/ui/Badge";
import { ACADEMIC_LEVELS } from "@/lib/constants";

function importNoticeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const imported = new URLSearchParams(window.location.search).get("imported");
  return imported ? `${imported} book(s) were added to the catalog from MARC import.` : null;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [notice] = useState(() => importNoticeFromUrl());

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (academicLevel) params.set("academicLevel", academicLevel);
    fetch(`/api/books?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setBooks(d.books || []);
          setTotal(d.total ?? (d.books || []).length);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, academicLevel]);

  return (
    <div>
      <PageHeader
        title="Book Management"
        description="Manage library catalog and physical copies"
        actions={<Link href="/portal/books/new"><Button><Plus className="h-4 w-4" /> Add Book</Button></Link>}
      />

      {notice && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>
      )}

      <Card className="mb-6">
        <div className="mb-3 text-sm text-slate-600">{total} book(s) in catalog</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search title, author, ISBN, DDC, LC..." value={search} onChange={(e) => { setLoading(true); setSearch(e.target.value); }} />
          </div>
          <Select label="Academic Level" value={academicLevel} onChange={(e) => { setLoading(true); setAcademicLevel(e.target.value); }} options={[...ACADEMIC_LEVELS]} />
        </div>
      </Card>

      {loading ? <LoadingSpinner /> : books.length === 0 ? (
        <EmptyState message="No books found." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3 hidden md:table-cell">ISBN</th>
                <th className="px-4 py-3 hidden lg:table-cell">DDC</th>
                <th className="px-4 py-3 hidden lg:table-cell">LC</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id as string} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{book.title as string}</td>
                  <td className="px-4 py-3">{book.author as string}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{(book.isbn as string) || "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{(book.ddc as string) || "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{(book.lcClassification as string) || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={(book.availableCopies as number) > 0 ? "AVAILABLE" : "BORROWED"} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/portal/books/${book.id}`} className="font-medium text-blue-700 hover:underline">View</Link>
                      <Link href={`/portal/books/${book.id}/edit`} className="font-medium text-blue-700 hover:underline">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
