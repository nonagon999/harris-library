"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Card, LoadingSpinner } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { BookFormFields } from "@/components/books/BookFormFields";
import { MarcEditor } from "@/components/marc/MarcEditor";
import { bookRecordToForm, formsEqual, type BookFormState } from "@/lib/books/form";

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [bookTitle, setBookTitle] = useState("");
  const [form, setForm] = useState<BookFormState | null>(null);
  const [initialForm, setInitialForm] = useState<BookFormState | null>(null);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const allowLeave = useRef(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/books/${id}`).then((r) => r.json()),
      fetch("/api/metadata").then((r) => r.json()),
    ])
      .then(([book, metadata]) => {
        if (book.error) throw new Error(book.error);
        const copies = (book.copies as { accessionNumber: string }[]) || [];
        const loaded = bookRecordToForm(book, { accessionNumber: copies[0]?.accessionNumber || "" });
        setBookTitle(book.title as string);
        setForm(loaded);
        setInitialForm(loaded);
        setCategories((metadata.categories || []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })));
      })
      .catch((err) => alert(err instanceof Error ? err.message : "Failed to load book"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (allowLeave.current || !form || !initialForm || formsEqual(form, initialForm)) return;
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [form, initialForm]);

  function update(field: keyof BookFormState, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSuccess("");
    setErrors((e) => {
      const next = { ...e };
      delete next[field];
      return next;
    });
  }

  function confirmLeave(): boolean {
    if (!form || !initialForm || formsEqual(form, initialForm)) return true;
    return confirm("You have unsaved changes. Are you sure you want to leave?");
  }

  function handleCancel() {
    if (!confirmLeave()) return;
    allowLeave.current = true;
    router.push(`/portal/books/${id}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setSaving(true);
    setErrors({});
    setSuccess("");

    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error || "Failed to update book");
      }

      setSuccess("Book updated successfully.");
      setInitialForm(form);
      allowLeave.current = true;
      router.push(`/portal/books/${id}?saved=1`);
    } catch (err) {
      if (!Object.keys(errors).length) {
        alert(err instanceof Error ? err.message : "Failed to save changes");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Edit Book"
        description={bookTitle}
        actions={
          <Link
            href={`/portal/books/${id}`}
            onClick={(e) => {
              if (!confirmLeave()) e.preventDefault();
            }}
            className="flex items-center gap-2 text-sm font-medium text-[var(--hmc-blue)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Details
          </Link>
        }
      />

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <BookFormFields form={form} errors={errors} categories={categories} mode="edit" onChange={update} />

          {form.coverImageUrl && (
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-700">Current Cover Preview</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.coverImageUrl} alt="Book cover" className="h-32 w-24 rounded-lg border object-cover" />
            </div>
          )}

          {Object.keys(errors).length > 0 && (
            <div className="md:col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Please correct the highlighted required fields.
            </div>
          )}

          <div className="md:col-span-2 flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>Cancel</Button>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <MarcEditor bookId={id} />
      </div>
    </div>
  );
}
