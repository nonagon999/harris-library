-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'LIBRARIAN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "academicLevel" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "author" TEXT NOT NULL,
    "coAuthor" TEXT,
    "publisher" TEXT,
    "publicationYear" INTEGER,
    "edition" TEXT,
    "volume" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "numberOfPages" INTEGER,
    "description" TEXT,
    "callNumber" TEXT,
    "ddc" TEXT,
    "subject" TEXT,
    "categoryId" TEXT,
    "collectionType" TEXT NOT NULL DEFAULT 'GENERAL_COLLECTION',
    "academicLevel" TEXT NOT NULL DEFAULT 'GENERAL',
    "coverImageUrl" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Book_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Book_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookCopy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "accessionNumber" TEXT NOT NULL,
    "barcode" TEXT,
    "locationId" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookCopy_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookCopy_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Borrower" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "borrowerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "studentId" TEXT,
    "employeeId" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "academicLevel" TEXT,
    "gradeLevel" TEXT,
    "yearLevel" TEXT,
    "section" TEXT,
    "department" TEXT,
    "position" TEXT,
    "email" TEXT,
    "contactNumber" TEXT,
    "address" TEXT,
    "profilePhoto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "BorrowingTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionNo" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "bookCopyId" TEXT NOT NULL,
    "borrowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'BORROWED',
    "renewalCount" INTEGER NOT NULL DEFAULT 0,
    "librarianId" TEXT,
    "notes" TEXT,
    "returnNotes" TEXT,
    "returnCondition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BorrowingTransaction_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "Borrower" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowingTransaction_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowingTransaction_bookCopyId_fkey" FOREIGN KEY ("bookCopyId") REFERENCES "BookCopy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowingTransaction_librarianId_fkey" FOREIGN KEY ("librarianId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LibrarySetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schoolName" TEXT NOT NULL DEFAULT 'Harris Memorial College, Inc.',
    "libraryName" TEXT NOT NULL DEFAULT 'Harris Memorial College Library',
    "logoUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "academicYear" TEXT NOT NULL DEFAULT '2025-2026',
    "borrowingPeriodDays" INTEGER NOT NULL DEFAULT 7,
    "maxBooksAllowed" INTEGER NOT NULL DEFAULT 3,
    "renewalLimit" INTEGER NOT NULL DEFAULT 2,
    "libraryRules" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "Book"("title");

-- CreateIndex
CREATE INDEX "Book_author_idx" ON "Book"("author");

-- CreateIndex
CREATE INDEX "Book_isbn_idx" ON "Book"("isbn");

-- CreateIndex
CREATE INDEX "Book_academicLevel_idx" ON "Book"("academicLevel");

-- CreateIndex
CREATE INDEX "Book_createdAt_idx" ON "Book"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookCopy_accessionNumber_key" ON "BookCopy"("accessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BookCopy_barcode_key" ON "BookCopy"("barcode");

-- CreateIndex
CREATE INDEX "BookCopy_bookId_idx" ON "BookCopy"("bookId");

-- CreateIndex
CREATE INDEX "BookCopy_status_idx" ON "BookCopy"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Borrower_studentId_key" ON "Borrower"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Borrower_employeeId_key" ON "Borrower"("employeeId");

-- CreateIndex
CREATE INDEX "Borrower_lastName_firstName_idx" ON "Borrower"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Borrower_studentId_idx" ON "Borrower"("studentId");

-- CreateIndex
CREATE INDEX "Borrower_employeeId_idx" ON "Borrower"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "BorrowingTransaction_transactionNo_key" ON "BorrowingTransaction"("transactionNo");

-- CreateIndex
CREATE INDEX "BorrowingTransaction_borrowDate_idx" ON "BorrowingTransaction"("borrowDate");

-- CreateIndex
CREATE INDEX "BorrowingTransaction_dueDate_idx" ON "BorrowingTransaction"("dueDate");

-- CreateIndex
CREATE INDEX "BorrowingTransaction_status_idx" ON "BorrowingTransaction"("status");

-- CreateIndex
CREATE INDEX "BorrowingTransaction_borrowerId_idx" ON "BorrowingTransaction"("borrowerId");

-- CreateIndex
CREATE INDEX "BorrowingTransaction_bookId_idx" ON "BorrowingTransaction"("bookId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");
