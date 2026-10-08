import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getBorrowerDisplayId, getBorrowerFullName } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const borrowerType = searchParams.get("borrowerType") || "";
    const academicLevel = searchParams.get("academicLevel") || "";
    const status = searchParams.get("status") || "";

    const where = {
      ...(borrowerType ? { borrowerType } : {}),
      ...(academicLevel ? { academicLevel } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { studentId: { contains: search } },
              { employeeId: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    const [borrowers, total] = await Promise.all([
      prisma.borrower.findMany({
        where,
        orderBy: { lastName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      }),
      prisma.borrower.count({ where }),
    ]);

    return NextResponse.json({
      borrowers: borrowers.map((b) => ({
        ...b,
        fullName: getBorrowerFullName(b),
        displayId: getBorrowerDisplayId(b),
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch borrowers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    if (body.studentId) {
      const dup = await prisma.borrower.findUnique({ where: { studentId: body.studentId } });
      if (dup) return NextResponse.json({ error: "Student ID already exists" }, { status: 400 });
    }
    if (body.employeeId) {
      const dup = await prisma.borrower.findUnique({ where: { employeeId: body.employeeId } });
      if (dup) return NextResponse.json({ error: "Employee ID already exists" }, { status: 400 });
    }

    const borrower = await prisma.borrower.create({
      data: {
        borrowerType: body.borrowerType,
        studentId: body.studentId || null,
        employeeId: body.employeeId || null,
        firstName: body.firstName,
        middleName: body.middleName,
        lastName: body.lastName,
        suffix: body.suffix,
        academicLevel: body.academicLevel || null,
        gradeLevel: body.gradeLevel,
        yearLevel: body.yearLevel,
        section: body.section,
        department: body.department,
        position: body.position,
        email: body.email,
        contactNumber: body.contactNumber,
        address: body.address,
        status: body.status || "ACTIVE",
      },
    });

    await logAudit({
      userId: user.id,
      action: "Added Borrower",
      module: "Borrowers",
      recordId: borrower.id,
      details: getBorrowerFullName(borrower),
    });

    return NextResponse.json(borrower, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create borrower" }, { status: 500 });
  }
}
