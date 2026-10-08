import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Harris Memorial College Library...");

  const adminHash = await bcrypt.hash("admin123", 12);
  const librarianHash = await bcrypt.hash("librarian123", 12);

  await prisma.user.upsert({
    where: { email: "admin@hmc.edu.ph" },
    update: {},
    create: {
      email: "admin@hmc.edu.ph",
      passwordHash: adminHash,
      firstName: "System",
      lastName: "Administrator",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "librarian@hmc.edu.ph" },
    update: {},
    create: {
      email: "librarian@hmc.edu.ph",
      passwordHash: librarianHash,
      firstName: "Maria",
      lastName: "Santos",
      role: "LIBRARIAN",
    },
  });

  const existingSettings = await prisma.librarySetting.findFirst();
  if (!existingSettings) {
    await prisma.librarySetting.create({
      data: {
        schoolName: "Harris Memorial College, Inc.",
        libraryName: "Harris Memorial College Library",
        academicYear: "2025-2026",
        borrowingPeriodDays: 7,
        maxBooksAllowed: 3,
        renewalLimit: 2,
        contactEmail: "library@hmc.edu.ph",
        contactPhone: "(02) 1234-5678",
      },
    });
  }

  const categories = [
    "Education", "Information Technology", "English", "Mathematics",
    "Science", "History", "Filipiniana", "Religion", "Arts",
  ];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const locations = [
    { name: "Preschool Library Section", academicLevel: "PRESCHOOL" as const },
    { name: "Elementary Library Section", academicLevel: "ELEMENTARY" as const },
    { name: "JHS Library Section", academicLevel: "JHS" as const },
    { name: "SHS Library Section", academicLevel: "SHS" as const },
    { name: "College Library Section", academicLevel: "COLLEGE" as const },
    { name: "Reference Section", academicLevel: "GENERAL" as const },
    { name: "Filipiniana Section", academicLevel: "GENERAL" as const },
    { name: "Faculty Section", academicLevel: "FACULTY_STAFF" as const },
    { name: "Children's Section", academicLevel: "PRESCHOOL" as const },
  ];
  for (const loc of locations) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    });
  }

  console.log("Seed completed (accounts + reference data only — no sample books/borrowers).");
  console.log("Admin: admin@hmc.edu.ph / admin123");
  console.log("Librarian: librarian@hmc.edu.ph / librarian123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
