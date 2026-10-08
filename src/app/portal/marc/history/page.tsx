"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, Card, LoadingSpinner, EmptyState } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { parseApiResponse } from "@/lib/api/response";

export default function MarcHistoryPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadHistory() {
    return fetch("/api/marc/history")
      .then((r) => r.json())
      .then((d) => setBatches(d.batches || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function syncPending() {
    if (!confirm("Add all valid preview records to the Books catalog? This is safe to run again — duplicates will be skipped.")) return;
    setSyncing(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/marc/import/sync-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipDuplicates: true }),
      });
      const parsed = await parseApiResponse<{ imported: number; skipped: number; failed: number; processed: number }>(res);
      if (!parsed.ok || !parsed.data) {
        throw new Error(parsed.errorMessage || "Sync failed.");
      }
      setMessage(`Synced ${parsed.data.imported} book(s) to the catalog (${parsed.data.processed} preview records processed).`);
      loadHistory();
      if (parsed.data.imported > 0) {
        router.push(`/portal/books?imported=${parsed.data.imported}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Import History"
        description="Past MARC / Koha migration imports"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={syncPending} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync Pending to Books"}
            </Button>
            <Link href="/portal/marc/import" className="text-sm font-medium text-[var(--hmc-blue)] hover:underline self-center">← Back to Import</Link>
          </div>
        }
      />

      {message && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>}
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {loading ? <LoadingSpinner /> : batches.length === 0 ? (
        <EmptyState message="No import history yet." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">File</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2 pr-4">In Catalog</th>
                  <th className="pb-2 pr-4">Duplicates</th>
                  <th className="pb-2 pr-4">Errors</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id as string} className="border-b border-slate-50">
                    <td className="py-3 pr-4">{formatDate(b.createdAt as string)}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{b.filename as string}</td>
                    <td className="py-3 pr-4">{b.totalRecords as number}</td>
                    <td className="py-3 pr-4">{b.importedCount as number}</td>
                    <td className="py-3 pr-4">{b.duplicateCount as number}</td>
                    <td className="py-3 pr-4">{b.errorCount as number}</td>
                    <td className="py-3">{b.status as string}</td>
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
