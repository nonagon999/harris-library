"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormFields";

export default function BorrowBookPage() {
  const [borrowers, setBorrowers] = useState<{ id: string; fullName: string; displayId: string }[]>([]);
  const [books, setBooks] = useState<{ id: string; title: string; copies: { id: string; accessionNumber: string; status: string }[] }[]>([]);
  const [form, setForm] = useState({ borrowerId: "", bookCopyId: "", dueDate: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/borrowers?limit=100").then((r) => r.json()).then((d) => setBorrowers(d.borrowers || []));
  }, []);

  useEffect(() => {
    if (search.length < 2) return;
    fetch(`/api/books?search=${search}&limit=10`).then((r) => r.json()).then(async (d) => {
      const withCopies = await Promise.all(
        (d.books || []).map(async (b: { id: string; title: string }) => {
          const detail = await fetch(`/api/books/${b.id}`).then((r) => r.json());
          return { id: b.id, title: b.title, copies: (detail.copies || []).filter((c: { status: string }) => c.status === "AVAILABLE") };
        })
      );
      setBooks(withCopies.filter((b) => b.copies.length > 0));
    });
  }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Book borrowed successfully!");
      setForm({ borrowerId: "", bookCopyId: "", dueDate: "", notes: "" });
      setSearch("");
      setBooks([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const availableCopies = books.flatMap((b) =>
    b.copies.map((c) => ({ value: c.id, label: `${b.title} — ${c.accessionNumber}` }))
  );

  return (
    <div>
      <PageHeader title="Borrow Book" description="Select borrower and physical copy" />
      <Card>
        <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
          <Select
            label="Select Borrower *"
            value={form.borrowerId}
            onChange={(e) => setForm({ ...form, borrowerId: e.target.value })}
            options={borrowers.map((b) => ({ value: b.id, label: `${b.fullName} (${b.displayId})` }))}
          />
          <Input label="Search Book" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type book title..." />
          <Select
            label="Select Physical Copy *"
            value={form.bookCopyId}
            onChange={(e) => setForm({ ...form, bookCopyId: e.target.value })}
            options={availableCopies}
          />
          <Input label="Due Date (optional)" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" disabled={loading || !form.borrowerId || !form.bookCopyId}>
            Confirm Borrowing
          </Button>
        </form>
      </Card>
    </div>
  );
}
