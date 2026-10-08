"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, EmptyState, LoadingSpinner } from "@/components/ui/Layout";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default function OverduePage() {
  const [books, setBooks] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports?type=overdue")
      .then((r) => r.json())
      .then((d) => setBooks(d.books || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Overdue Books" description="Books past their due date" />
      {loading ? <LoadingSpinner /> : books.length === 0 ? (
        <EmptyState message="No overdue books found." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-slate-500">
                <th className="pb-2">Book</th><th className="pb-2">Borrower</th><th className="pb-2">ID</th><th className="pb-2">Due Date</th><th className="pb-2">Days Overdue</th><th className="pb-2">Status</th>
              </tr></thead>
              <tbody>
                {books.map((b, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2">{b.bookTitle as string}</td>
                    <td className="py-2">{b.borrowerName as string}</td>
                    <td className="py-2 font-mono text-xs">{b.borrowerId as string}</td>
                    <td className="py-2">{formatDate(b.dueDate as string)}</td>
                    <td className="py-2 font-semibold text-red-600">{b.daysOverdue as number}</td>
                    <td className="py-2"><StatusBadge status={b.status as string} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
