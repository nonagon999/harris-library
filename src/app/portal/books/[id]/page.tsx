"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { PageHeader, Card, LoadingSpinner } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormFields";
import { StatusBadge } from "@/components/ui/Badge";
import { labelFor, ACADEMIC_LEVELS, COLLECTION_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { MarcEditor } from "@/components/marc/MarcEditor";

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [book, setBook] = useState<Record<string, unknown> | null>(null);
  const [savedMessage] = useState(
    () => (searchParams.get("saved") === "1" ? "Book updated successfully." : "")
  );
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [newCopy, setNewCopy] = useState({ accessionNumber: "", barcode: "", locationId: "" });

  function loadBook() {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBook(data);
      })
      .catch(console.error);
  }

  useEffect(() => {
    loadBook();
    fetch("/api/metadata").then((r) => r.json()).then((d) => {
      setLocations((d.locations || []).map((l: { id: string; name: string }) => ({ value: l.id, label: l.name })));
    });
  }, [id]);

  async function addCopy(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/books/${id}/copies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCopy),
    });
    if (res.ok) {
      setNewCopy({ accessionNumber: "", barcode: "", locationId: "" });
      loadBook();
    } else {
      const d = await res.json();
      alert(d.error);
    }
  }

  async function archiveBook() {
    if (!confirm("Archive this book?")) return;
    await fetch(`/api/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
    loadBook();
  }

  if (!book) return <LoadingSpinner />;

  const copies = (book.copies as Record<string, unknown>[]) || [];
  const updatedBy = book.updatedBy as { firstName?: string; lastName?: string } | null;

  return (
    <div>
      <PageHeader
        title={book.title as string}
        description={`by ${book.author as string}`}
        actions={
          <>
            {!book.isArchived && (
              <Link href={`/portal/books/${id}/edit`}>
                <Button size="sm">
                  <Pencil className="h-4 w-4" /> Edit Book
                </Button>
              </Link>
            )}
            {!book.isArchived && (
              <Button variant="danger" size="sm" onClick={archiveBook}>Archive</Button>
            )}
          </>
        }
      />

      {savedMessage && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{savedMessage}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Book Details">
          <dl className="grid gap-2 text-sm">
            {typeof book.subtitle === "string" && book.subtitle && (
              <div className="flex justify-between"><dt className="text-slate-500">Subtitle</dt><dd>{book.subtitle}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-slate-500">ISBN</dt><dd>{(book.isbn as string) || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Publisher</dt><dd>{(book.publisher as string) || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Publication Year</dt><dd>{book.publicationYear ? String(book.publicationYear) : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Edition</dt><dd>{(book.edition as string) || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Pages</dt><dd>{book.numberOfPages ? String(book.numberOfPages) : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Call Number</dt><dd>{(book.callNumber as string) || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">DDC</dt><dd>{(book.ddc as string) || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">LC Classification</dt><dd>{(book.lcClassification as string) || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Subject</dt><dd>{(book.subject as string) || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Level</dt><dd>{labelFor(ACADEMIC_LEVELS, book.academicLevel as string)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Collection</dt><dd>{labelFor(COLLECTION_TYPES, book.collectionType as string)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Added</dt><dd>{formatDate(book.createdAt as string)}</dd></div>
            {typeof book.updatedAt === "string" && (
              <div className="flex justify-between"><dt className="text-slate-500">Last Updated</dt><dd>{formatDate(book.updatedAt)}</dd></div>
            )}
            {updatedBy && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Updated By</dt>
                <dd>{`${updatedBy.firstName || ""} ${updatedBy.lastName || ""}`.trim() || "—"}</dd>
              </div>
            )}
          </dl>
          {typeof book.description === "string" && book.description && (
            <p className="mt-4 text-sm text-slate-600">{book.description}</p>
          )}
          {typeof book.coverImageUrl === "string" && book.coverImageUrl && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-500">Cover</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={book.coverImageUrl} alt="Book cover" className="h-32 w-24 rounded-lg border object-cover" />
            </div>
          )}
        </Card>

        <Card title="Add Physical Copy">
          <form onSubmit={addCopy} className="space-y-3">
            <Input label="Accession Number *" value={newCopy.accessionNumber} onChange={(e) => setNewCopy({ ...newCopy, accessionNumber: e.target.value })} required />
            <Input label="Barcode" value={newCopy.barcode} onChange={(e) => setNewCopy({ ...newCopy, barcode: e.target.value })} />
            <Select label="Location" value={newCopy.locationId} onChange={(e) => setNewCopy({ ...newCopy, locationId: e.target.value })} options={locations} />
            <Button type="submit">Add Copy</Button>
          </form>
        </Card>
      </div>

      <Card title={`Physical Copies (${copies.length})`} className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="pb-2">Accession #</th><th className="pb-2">Barcode</th><th className="pb-2">Location</th><th className="pb-2">Condition</th><th className="pb-2">Status</th>
            </tr></thead>
            <tbody>
              {copies.map((c) => (
                <tr key={c.id as string} className="border-b border-slate-50">
                  <td className="py-2 font-mono">{c.accessionNumber as string}</td>
                  <td className="py-2">{(c.barcode as string) || "—"}</td>
                  <td className="py-2">{((c.location as { name?: string })?.name) || "—"}</td>
                  <td className="py-2">{c.condition as string}</td>
                  <td className="py-2"><StatusBadge status={c.status as string} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6">
        <MarcEditor bookId={id} />
      </div>
    </div>
  );
}
