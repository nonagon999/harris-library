import { prisma } from "@/lib/prisma";
import type { CopyStatus, TransactionStatus } from "@/lib/types";

export async function syncOverdueStatuses() {
  const now = new Date();

  const overdueTransactions = await prisma.borrowingTransaction.findMany({
    where: {
      returnDate: null,
      dueDate: { lt: now },
      status: { in: ["BORROWED", "RENEWED"] },
    },
    include: { bookCopy: true },
  });

  for (const txn of overdueTransactions) {
    await prisma.$transaction([
      prisma.borrowingTransaction.update({
        where: { id: txn.id },
        data: { status: "OVERDUE" },
      }),
      prisma.bookCopy.update({
        where: { id: txn.bookCopyId },
        data: { status: "OVERDUE" },
      }),
    ]);
  }

  return overdueTransactions.length;
}

export function computeTransactionStatus(
  returnDate: Date | null,
  dueDate: Date,
  currentStatus: TransactionStatus
): TransactionStatus {
  if (returnDate) {
    if (currentStatus === "LOST" || currentStatus === "DAMAGED") return currentStatus;
    return "RETURNED";
  }
  if (new Date() > dueDate) return "OVERDUE";
  if (currentStatus === "RENEWED") return "RENEWED";
  return "BORROWED";
}

export function daysOverdue(dueDate: Date): number {
  const now = new Date();
  if (now <= dueDate) return 0;
  return Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
}

export async function getLibrarySettings() {
  let settings = await prisma.librarySetting.findFirst();
  if (!settings) {
    settings = await prisma.librarySetting.create({ data: {} });
  }
  return settings;
}

export function mapReturnToCopyStatus(
  condition?: string | null,
  markAs?: "LOST" | "DAMAGED" | "FOR_REPAIR"
): CopyStatus {
  if (markAs === "LOST") return "LOST";
  if (markAs === "DAMAGED") return "DAMAGED";
  if (markAs === "FOR_REPAIR") return "FOR_REPAIR";
  return "AVAILABLE";
}
