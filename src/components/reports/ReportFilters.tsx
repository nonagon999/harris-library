"use client";

import { DATE_PRESETS } from "@/lib/date-filters";
import { Input, Select } from "@/components/ui/FormFields";

interface DateRangeFilterProps {
  preset: string;
  onPresetChange: (v: string) => void;
  startDate?: string;
  endDate?: string;
  onStartChange?: (v: string) => void;
  onEndChange?: (v: string) => void;
}

export function DateRangeFilter({
  preset,
  onPresetChange,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select
        label="Date Range"
        value={preset}
        onChange={(e) => onPresetChange(e.target.value)}
        options={DATE_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
      />
      {preset === "custom" && (
        <>
          <Input label="Start" type="date" value={startDate || ""} onChange={(e) => onStartChange?.(e.target.value)} />
          <Input label="End" type="date" value={endDate || ""} onChange={(e) => onEndChange?.(e.target.value)} />
        </>
      )}
    </div>
  );
}

interface ExportButtonsProps {
  onExportCSV: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
}

export function ExportButtons({ onExportCSV, onExportPDF, onPrint }: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={onExportCSV}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
      >
        Export CSV
      </button>
      {onExportPDF && (
        <button
          type="button"
          onClick={onExportPDF}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Export PDF
        </button>
      )}
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          🖨 Print Report
        </button>
      )}
    </div>
  );
}
