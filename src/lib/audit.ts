import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  userId?: string;
  action: string;
  module: string;
  recordId?: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        module: params.module,
        recordId: params.recordId,
        details: params.details,
      },
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}
