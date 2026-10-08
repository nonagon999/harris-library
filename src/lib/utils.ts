import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getBorrowerDisplayId(borrower: {
  borrowerType: string;
  studentId?: string | null;
  employeeId?: string | null;
  id: string;
}): string {
  if (borrower.studentId) return borrower.studentId;
  if (borrower.employeeId) return borrower.employeeId;
  return borrower.id.slice(0, 8).toUpperCase();
}

export function getBorrowerFullName(borrower: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
}): string {
  const parts = [borrower.firstName, borrower.middleName, borrower.lastName, borrower.suffix].filter(Boolean);
  return parts.join(" ");
}

export async function generateTransactionNo(): Promise<string> {
  const now = new Date();
  const prefix = `TXN${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}${random}`;
}
