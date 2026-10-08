import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const settingsSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  libraryName: z.string().min(1, "Library name is required"),
  logoUrl: z.string().nullable().optional(),
  contactEmail: z.union([z.string().email(), z.literal("")]).nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  academicYear: z.string().min(1, "Academic year is required"),
  borrowingPeriodDays: z.coerce.number().int().min(1).max(365),
  maxBooksAllowed: z.coerce.number().int().min(1).max(50),
  renewalLimit: z.coerce.number().int().min(0).max(20),
  libraryRules: z.string().nullable().optional(),
});

function authErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
  }
  return null;
}

export async function GET() {
  try {
    await requireAuth();
    let settings = await prisma.librarySetting.findFirst();
    if (!settings) settings = await prisma.librarySetting.create({ data: {} });
    return NextResponse.json(settings);
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid settings";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = {
      ...parsed.data,
      contactEmail: parsed.data.contactEmail || null,
      logoUrl: parsed.data.logoUrl || null,
      address: parsed.data.address || null,
      contactPhone: parsed.data.contactPhone || null,
      libraryRules: parsed.data.libraryRules || null,
    };

    const existing = await prisma.librarySetting.findFirst();
    const settings = existing
      ? await prisma.librarySetting.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.librarySetting.create({ data });

    await logAudit({
      userId: user.id,
      action: "Updated Settings",
      module: "Settings",
      details: "Library settings updated",
    });

    return NextResponse.json(settings);
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error(error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
