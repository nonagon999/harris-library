import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export type DateRangePreset = "today" | "week" | "month" | "year" | "all" | "custom";

export function getDateRange(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): { start: Date | null; end: Date | null } {
  const now = new Date();
  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "custom":
      return {
        start: customStart ? startOfDay(new Date(customStart)) : null,
        end: customEnd ? endOfDay(new Date(customEnd)) : null,
      };
    default:
      return { start: null, end: null };
  }
}

export function buildDateFilter(
  preset: DateRangePreset,
  field: string,
  customStart?: string,
  customEnd?: string
) {
  const { start, end } = getDateRange(preset, customStart, customEnd);
  if (!start && !end) return {};
  const filter: Record<string, unknown> = {};
  if (start || end) {
    filter[field] = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    };
  }
  return filter;
}

export const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
] as const;
