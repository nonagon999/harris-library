"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { BookFormFields } from "@/components/books/BookFormFields";
import { emptyBookForm, type BookFormState } from "@/lib/books/form";

export default function NewBookPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<BookFormState>(emptyBookForm());

  useEffect(() => {
    fetch("/api/metadata").then((r) => r.json()).then((d) => {
      setCategories((d.categories || []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })));
    });
  }, []);

  function update(field: keyof BookFormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error || "Failed to add book");
      }
      router.push(`/portal/books/${data.id}?saved=1`);
    } catch (err) {
      if (!Object.keys(errors).length) {
        alert(err instanceof Error ? err.message : "Failed to add book");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    router.back();
  }

  return (
    <div>
      <PageHeader title="Add Book" description="Add a new title — MARC record is created automatically" />
      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <BookFormFields form={form} errors={errors} categories={categories} mode="create" onChange={update} />

          {Object.keys(errors).length > 0 && (
            <div className="md:col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Please correct the highlighted required fields.
            </div>
          )}

          <div className="md:col-span-2 flex gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Book"}</Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
