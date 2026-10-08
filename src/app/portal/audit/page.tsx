"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, LoadingSpinner, EmptyState } from "@/components/ui/Layout";
import { formatDateTime } from "@/lib/utils";

export default function AuditPage() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Audit Log" description="System activity trail" />
      {loading ? <LoadingSpinner /> : logs.length === 0 ? (
        <EmptyState message="No audit logs found." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-slate-500">
                <th className="pb-2">Date/Time</th><th className="pb-2">User</th><th className="pb-2">Action</th><th className="pb-2">Module</th><th className="pb-2">Details</th>
              </tr></thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id as string} className="border-b border-slate-50">
                    <td className="py-2 whitespace-nowrap">{formatDateTime(log.createdAt as string)}</td>
                    <td className="py-2">
                      {log.user
                        ? `${(log.user as { firstName: string }).firstName} ${(log.user as { lastName: string }).lastName}`
                        : "System"}
                    </td>
                    <td className="py-2">{log.action as string}</td>
                    <td className="py-2">{log.module as string}</td>
                    <td className="py-2 text-slate-600">{(log.details as string) || "—"}</td>
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
