"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, Card, LoadingSpinner, EmptyState } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormFields";
import { StatusBadge } from "@/components/ui/Badge";
import { BORROWER_TYPES, ACADEMIC_LEVELS } from "@/lib/constants";

export default function BorrowersPage() {
  const [borrowers, setBorrowers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [borrowerType, setBorrowerType] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (borrowerType) params.set("borrowerType", borrowerType);
    fetch(`/api/borrowers?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setBorrowers(d.borrowers || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, borrowerType]);

  return (
    <div>
      <PageHeader
        title="Borrowers"
        description="Manage students, faculty, and staff borrowers"
        actions={<Link href="/portal/borrowers/new"><Button><Plus className="h-4 w-4" /> Add Borrower</Button></Link>}
      />

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search name, ID, email..." value={search} onChange={(e) => { setLoading(true); setSearch(e.target.value); }} />
          </div>
          <Select label="Type" value={borrowerType} onChange={(e) => { setLoading(true); setBorrowerType(e.target.value); }} options={[...BORROWER_TYPES]} />
        </div>
      </Card>

      {loading ? <LoadingSpinner /> : borrowers.length === 0 ? (
        <EmptyState message="No borrowers found." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">ID</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {borrowers.map((b) => (
                <tr key={b.id as string} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{b.fullName as string}</td>
                  <td className="px-4 py-3 font-mono text-xs">{b.displayId as string}</td>
                  <td className="px-4 py-3">{b.borrowerType as string}</td>
                  <td className="px-4 py-3">{(b.department as string) || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status as string} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/portal/borrowers/${b.id}`} className="text-blue-700 hover:underline">View</Link>
                    {" · "}
                    <Link href={`/portal/borrowers/${b.id}?edit=1`} className="text-blue-700 hover:underline">Edit</Link>
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
