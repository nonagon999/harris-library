import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@hmc.edu.ph", password: "admin123" }),
  });
  const cookie = res.headers.get("set-cookie")?.split(";")[0] || "";
  if (!res.ok) throw new Error("Login failed");
  return cookie;
}

async function main() {
  const cookie = await login();
  const headers = { "Content-Type": "application/json", cookie };

  const created = await prisma.book.create({
    data: {
      title: "Introduction to Programming",
      author: "John Smith",
      publisher: "ABC Publishing",
      placeOfPublication: "Manila",
      publicationYear: 2025,
      numberOfPages: 350,
      callNumber: "TEST-EDIT-001",
      ddc: "005.12",
      lcClassification: "QA76",
    },
  });
  await prisma.bookCopy.create({
    data: { bookId: created.id, accessionNumber: `ACC-${Date.now()}`, status: "AVAILABLE" },
  });

  const id = created.id;
  const put = await fetch(`${BASE}/api/books/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      title: "Introduction to Programming Using Java",
      author: "John Smith",
      publisher: "ABC Publishing",
      placeOfPublication: "Manila",
      copyright: 2025,
      pages: 350,
      callNumber: "TEST-EDIT-001",
      ddc: "005.133",
      lcClassification: "QA76.73.J38",
    }),
  });
  const updated = await put.json();
  if (!put.ok) throw new Error(`PUT failed: ${JSON.stringify(updated)}`);
  if (updated.id !== id) throw new Error("Book ID changed — duplicate created");
  if (updated.title !== "Introduction to Programming Using Java") throw new Error("Title not updated");
  if (updated.ddc !== "005.133") throw new Error("DDC not updated");
  if (updated.lcClassification !== "QA76.73.J38") throw new Error("LC not updated");

  const count = await prisma.book.count({ where: { title: { contains: "Introduction to Programming" } } });
  if (count !== 1) throw new Error(`Expected 1 book, found ${count}`);

  const publicPut = await fetch(`${BASE}/api/books/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Hacked" }),
  });
  if (publicPut.status !== 401) throw new Error(`Expected 401 without auth, got ${publicPut.status}`);

  console.log("All edit book tests passed.");
  await prisma.marcSubfield.deleteMany({ where: { marcField: { marcRecord: { bookId: id } } } });
  await prisma.marcField.deleteMany({ where: { marcRecord: { bookId: id } } });
  await prisma.marcRecord.deleteMany({ where: { bookId: id } });
  await prisma.bookCopy.deleteMany({ where: { bookId: id } });
  await prisma.book.delete({ where: { id } });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
