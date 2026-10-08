import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getBorrowerDisplayId, getBorrowerFullName } from "@/lib/utils";
import { daysOverdue } from "@/lib/circulation";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const borrower = await prisma.borrower.findUnique({
      where: { id },
      include: {
        transactions: {
          include: { book: true, bookCopy: true },
          orderBy: { borrowDate: "desc" },
        },
      },
    });

    if (!borrower) return NextResponse.json({ error: "Borrower not found" }, { status: 404 });

    const active = borrower.transactions.filter((t) => !t.returnDate);
    const summary = {
      totalBorrowed: borrower.transactions.length,
      currentlyBorrowed: active.length,
      returned: borrower.transactions.filter((t) => t.status === "RETURNED").length,
      overdue: active.filter((t) => t.status === "OVERDUE").length,
      lost: borrower.transactions.filter((t) => t.status === "LOST").length,
      damaged: borrower.transactions.filter((t) => t.status === "DAMAGED").length,
    };

    return NextResponse.json({
      ...borrower,
      fullName: getBorrowerFullName(borrower),
      displayId: getBorrowerDisplayId(borrower),
      summary,
      transactions: borrower.transactions.map((t) => ({
        ...t,
        daysOverdue: !t.returnDate && t.status === "OVERDUE" ? daysOverdue(t.dueDate) : 0,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch borrower" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.borrower.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Borrower not found" }, { status: 404 });

    if (body.studentId) {
      const dup = await prisma.borrower.findFirst({
        where: { studentId: body.studentId, NOT: { id } },
      });
      if (dup) return NextResponse.json({ error: "Student ID already exists" }, { status: 400 });
    }
    if (body.employeeId) {
      const dup = await prisma.borrower.findFirst({
        where: { employeeId: body.employeeId, NOT: { id } },
      });
      if (dup) return NextResponse.json({ error: "Employee ID already exists" }, { status: 400 });
    }

    if (body.status === "INACTIVE" || body.status === "SUSPENDED") {
      const active = await prisma.borrowingTransaction.count({
        where: { borrowerId: id, returnDate: null },
      });
      if (active > 0) {
        return NextResponse.json(
          { error: `Borrower has ${active} active borrowed book(s). Return them first.` },
          { status: 400 }
        );
      }
    }

    const borrower = await prisma.borrower.update({
      where: { id },
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
        status: body.status,
      },
    });

    await logAudit({
      userId: user.id,
      action: "Updated Borrower",
      module: "Borrowers",
      recordId: borrower.id,
      details: getBorrowerFullName(borrower),
    });

    return NextResponse.json(borrower);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update borrower" }, { status: 500 });
  }
}
