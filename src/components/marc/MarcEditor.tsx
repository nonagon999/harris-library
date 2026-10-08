"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormFields";
import { Card } from "@/components/ui/Layout";

type EditorRow = {
  tag: string;
  ind1: string;
  ind2: string;
  controlValue: string;
  subfields: { code: string; value: string }[];
};

export function MarcEditor({ bookId }: { bookId: string }) {
  const [rows, setRows] = useState<EditorRow[]>([]);
  const [leader, setLeader] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/marc/records/${bookId}`)
      .then((r) => r.json())
      .then((marc) => {
        setLeader(marc.leader || "");
        setRows(
          (marc.fields || []).map((f: Record<string, unknown>) => ({
            tag: String(f.tag),
            ind1: String(f.ind1 ?? " "),
            ind2: String(f.ind2 ?? " "),
            controlValue: String(f.controlValue ?? ""),
            subfields: Array.isArray(f.subfields)
              ? f.subfields.map((s: { code: string; value: string }) => ({ code: s.code, value: s.value }))
              : [{ code: "a", value: "" }],
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [bookId]);

  function addField() {
    setRows((r) => [...r, { tag: "245", ind1: "1", ind2: "0", controlValue: "", subfields: [{ code: "a", value: "" }] }]);
  }

  function removeField(index: number) {
    setRows((r) => r.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/marc/records/${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leader,
        fields: rows.map((row) => ({
          tag: row.tag,
          ind1: row.ind1,
          ind2: row.ind2,
          controlValue: row.controlValue || undefined,
          subfields: row.subfields.filter((s) => s.value.trim()),
        })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? "MARC record saved." : data.error || "Save failed.");
  }

  if (loading) return <p className="text-sm text-slate-500">Loading MARC record...</p>;

  return (
    <Card title="MARC Record Editor">
      <div className="mb-4">
        <Input label="Leader" value={leader} onChange={(e) => setLeader(e.target.value)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-2 pr-2">Tag</th>
              <th className="pb-2 pr-2">Ind1</th>
              <th className="pb-2 pr-2">Ind2</th>
              <th className="pb-2 pr-2">Subfields</th>
              <th className="pb-2"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isControl = /00[1-9]/.test(row.tag) || row.tag === "008";
              return (
                <tr key={i} className="border-b border-slate-50 align-top">
                  <td className="py-2 pr-2">
                    <input className="w-14 rounded border px-2 py-1 font-mono" value={row.tag} onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, tag: e.target.value } : r))} />
                  </td>
                  <td className="py-2 pr-2">
                    {!isControl && <input className="w-10 rounded border px-2 py-1 font-mono" maxLength={1} value={row.ind1} onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, ind1: e.target.value } : r))} />}
                  </td>
                  <td className="py-2 pr-2">
                    {!isControl && <input className="w-10 rounded border px-2 py-1 font-mono" maxLength={1} value={row.ind2} onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, ind2: e.target.value } : r))} />}
                  </td>
                  <td className="py-2 pr-2">
                    {isControl ? (
                      <input className="w-full rounded border px-2 py-1 font-mono text-xs" value={row.controlValue} onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, controlValue: e.target.value } : r))} />
                    ) : (
                      <div className="space-y-1">
                        {row.subfields.map((sf, si) => (
                          <div key={si} className="flex gap-1">
                            <input className="w-10 rounded border px-1 py-1 font-mono" value={sf.code} onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, subfields: r.subfields.map((s, k) => k === si ? { ...s, code: e.target.value } : s) } : r))} />
                            <input className="min-w-0 flex-1 rounded border px-2 py-1" value={sf.value} onChange={(e) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, subfields: r.subfields.map((s, k) => k === si ? { ...s, value: e.target.value } : s) } : r))} />
                          </div>
                        ))}
                        <button type="button" className="text-xs text-[var(--hmc-blue)]" onClick={() => setRows((rs) => rs.map((r, j) => j === i ? { ...r, subfields: [...r.subfields, { code: "a", value: "" }] } : r))}>+ subfield</button>
                      </div>
                    )}
                  </td>
                  <td className="py-2">
                    <button type="button" className="text-xs text-red-600" onClick={() => removeField(i)}>Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addField}>Add Field</Button>
        <Button type="button" size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save MARC"}</Button>
        <a href={`/api/marc/export?bookId=${bookId}&format=marc21`} className="inline-flex items-center rounded-lg border border-[var(--hmc-blue-border)] px-3 py-1.5 text-sm text-[var(--hmc-blue)] hover:bg-[var(--hmc-blue-muted)]">Export MARC21</a>
        <a href={`/api/marc/export?bookId=${bookId}&format=marcxml`} className="inline-flex items-center rounded-lg border border-[var(--hmc-blue-border)] px-3 py-1.5 text-sm text-[var(--hmc-blue)] hover:bg-[var(--hmc-blue-muted)]">Export MARCXML</a>
      </div>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </Card>
  );
}
