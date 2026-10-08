import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAuth();
    const batches = await prisma.marcImportBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        importedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return NextResponse.json({ batches });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load import history." }, { status: 500 });
  }
}
