"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, EmptyState } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, getBorrowerFullName } from "@/lib/utils";

export default function ReturnBookPage() {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/transactions?status=BORROWED&limit=50")
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions || []));
    fetch("/api/transactions?status=OVERDUE&limit=50")
      .then((r) => r.json())
      .then((d) => setTransactions((prev) => [...prev, ...(d.transactions || [])]));
  }, []);

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const book = t.book as { title: string };
    const copy = t.bookCopy as { accessionNumber: string };
    const borrower = t.borrower as { firstName: string; lastName: string };
    return (
      book.title.toLowerCase().includes(s) ||
      copy.accessionNumber.toLowerCase().includes(s) ||
      getBorrowerFullName(borrower).toLowerCase().includes(s)
    );
  });

  async function handleReturn(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${id}/return`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      alert("Book returned successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Return Book" description="Search and process book returns" />
      <Card className="mb-6">
        <Input placeholder="Search by title, accession number, or borrower..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState message="No active borrowed books found." />
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id as string} className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{(t.book as { title: string }).title}</p>
                <p className="text-sm text-slate-500">
                  {(t.bookCopy as { accessionNumber: string }).accessionNumber} — {getBorrowerFullName(t.borrower as Parameters<typeof getBorrowerFullName>[0])}
                </p>
                <p className="text-xs text-slate-400">Due: {formatDate(t.dueDate as string)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={t.status as string} />
                <Button size="sm" onClick={() => handleReturn(t.id as string)} disabled={loading}>Return</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
