"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, AlertTriangle } from "lucide-react";
import { PageHeader, Card, LoadingSpinner } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { parseApiResponse } from "@/lib/api/response";

type PreviewRecord = {
  id: string;
  recordIndex: number;
  status: string;
  title: string | null;
  author: string | null;
  errorMessage: string | null;
  preview: { tag: string; ind1?: string; ind2?: string; value?: string; subfields?: { code: string; value: string }[] }[];
};

type ImportSummary = {
  total: number;
  valid: number;
  duplicates: number;
  errors: number;
  filename: string;
};

export default function MarcImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [records, setRecords] = useState<PreviewRecord[]>([]);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [commitImmediately, setCommitImmediately] = useState(true);

  async function runExecute(targetBatchId: string) {
    const res = await fetch(`/api/marc/import/${targetBatchId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skipDuplicates: true }),
    });

    const parsed = await parseApiResponse<{
      imported: number;
      skipped: number;
      failed: number;
    }>(res);

    if (!parsed.ok || !parsed.data) {
      throw new Error(parsed.errorMessage || "Import execution failed.");
    }

    return parsed.data;
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setReport(null);
    setError(null);
    setSummary(null);
    setRecords([]);
    setBatchId(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/marc/import", { method: "POST", body: fd });
      const parsed = await parseApiResponse<{
        batchId: string;
        total: number;
        valid: number;
        duplicates: number;
        errors: number;
        filename?: string;
      }>(res);

      if (!parsed.ok || !parsed.data?.batchId) {
        throw new Error(parsed.errorMessage || "Koha import failed.");
      }

      const data = parsed.data;
      setBatchId(data.batchId);
      setSummary({
        total: data.total,
        valid: data.valid,
        duplicates: data.duplicates,
        errors: data.errors,
        filename: data.filename || file.name,
      });

      const detailRes = await fetch(`/api/marc/import/${data.batchId}`);
      const detailParsed = await parseApiResponse<{ records: PreviewRecord[] }>(detailRes);

      if (!detailParsed.ok) {
        throw new Error(detailParsed.errorMessage || "Failed to load import preview.");
      }

      setRecords(detailParsed.data?.records || []);

      if (commitImmediately && data.valid > 0) {
        setImporting(true);
        const exec = await runExecute(data.batchId);
        setReport(
          `Koha Import Summary — Successfully imported: ${exec.imported}, Skipped duplicates: ${exec.skipped}, Failed: ${exec.failed}`
        );
        router.push(`/portal/books?imported=${exec.imported}`);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Koha import failed.");
    } finally {
      setLoading(false);
      setImporting(false);
    }
  }

  async function executeImport() {
    if (!batchId) return;
    if (!confirm("Add valid records to the library catalog? Existing books will not be overwritten.")) return;

    setImporting(true);
    setError(null);

    try {
      const data = await runExecute(batchId);
      setReport(
        `Koha Import Summary — Successfully imported: ${data.imported}, Skipped duplicates: ${data.skipped}, Failed: ${data.failed}`
      );
      router.push(`/portal/books?imported=${data.imported}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import execution failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="MARC / Koha Migration"
        description="Import bibliographic records from Koha MARC exports (.mrc, .marc, .xml)"
        actions={<Link href="/portal/marc/history"><Button variant="outline" size="sm">Import History</Button></Link>}
      />

      <Card className="mb-6">
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Upload validates your Koha file and stores a preview. Valid records must be <strong>added to the catalog</strong> to
            appear in Books — use the button below or enable automatic catalog import.
          </p>
        </div>

        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">MARC file</label>
              <input
                type="file"
                accept=".mrc,.marc,.xml,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
              <p className="mt-1 text-xs text-slate-500">Supports ISO 2709 (.mrc) and MARCXML from Koha. Max 10 MB.</p>
            </div>
            <Button type="submit" disabled={loading || importing || !file}>
              <Upload className="h-4 w-4" />
              {loading || importing ? "Processing..." : "Upload & Import"}
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={commitImmediately}
              onChange={(e) => setCommitImmediately(e.target.checked)}
              className="rounded border-slate-300"
            />
            Add valid records to the Books catalog immediately after upload
          </label>
        </form>
      </Card>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Koha Import Failed</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {(loading || importing) && <LoadingSpinner />}

      {summary && (
        <Card title="Import Preview" className="mb-6">
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div><dt className="text-slate-500">File</dt><dd className="font-medium">{summary.filename}</dd></div>
            <div><dt className="text-slate-500">Total Records</dt><dd className="font-medium">{summary.total}</dd></div>
            <div><dt className="text-slate-500">Valid</dt><dd className="font-medium text-green-700">{summary.valid}</dd></div>
            <div><dt className="text-slate-500">Duplicates</dt><dd className="font-medium text-amber-700">{summary.duplicates}</dd></div>
            <div><dt className="text-slate-500">Errors</dt><dd className="font-medium text-red-700">{summary.errors}</dd></div>
          </dl>
          {!commitImmediately && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={executeImport} disabled={importing || summary.valid === 0}>
                {importing ? "Adding to catalog..." : "Add Valid Records to Books Catalog"}
              </Button>
            </div>
          )}
          {report && <p className="mt-3 text-sm font-medium text-[var(--hmc-blue)]">{report}</p>}
        </Card>
      )}

      {records.length > 0 && (
        <Card title="Record Preview">
          <div className="max-h-[480px] space-y-3 overflow-y-auto">
            {records.slice(0, 50).map((rec) => (
              <div key={rec.id} className="rounded-lg border border-slate-200 p-3">
                <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setExpanded(expanded === rec.recordIndex ? null : rec.recordIndex)}>
                  <span className="font-medium">Record #{rec.recordIndex} — {rec.title || "Untitled"}</span>
                  <span className={`text-xs font-semibold ${rec.status === "VALID" ? "text-green-700" : rec.status === "DUPLICATE" ? "text-amber-700" : rec.status === "IMPORTED" ? "text-blue-700" : "text-red-700"}`}>{rec.status}</span>
                </button>
                {rec.errorMessage && <p className="mt-1 text-xs text-red-600">{rec.errorMessage}</p>}
                {expanded === rec.recordIndex && (
                  <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-2 text-xs">{rec.preview.map((line) => {
                    if (line.value) return `${line.tag}\n  ${line.value}`;
                    const subs = (line.subfields || []).map((s) => `$${s.code} ${s.value}`).join("\n  ");
                    return `${line.tag} ${line.ind1 ?? ""}${line.ind2 ?? ""}\n  ${subs}`;
                  }).join("\n\n")}</pre>
                )}
              </div>
            ))}
            {records.length > 50 && <p className="text-xs text-slate-500">Showing first 50 of {records.length} records.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
