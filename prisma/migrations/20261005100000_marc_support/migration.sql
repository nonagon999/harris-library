-- MARC21 support + extended bibliographic fields for Harris Library

ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "editor" TEXT;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "placeOfPublication" TEXT;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "illustration" TEXT;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "seriesName" TEXT;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "seriesNumber" TEXT;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "note" TEXT;

ALTER TABLE "Book" ALTER COLUMN "author" SET DEFAULT '';

CREATE INDEX IF NOT EXISTS "Book_callNumber_idx" ON "Book"("callNumber");
CREATE INDEX IF NOT EXISTS "Book_publisher_idx" ON "Book"("publisher");
CREATE INDEX IF NOT EXISTS "Book_subject_idx" ON "Book"("subject");
CREATE INDEX IF NOT EXISTS "Book_seriesName_idx" ON "Book"("seriesName");

CREATE TABLE IF NOT EXISTS "MarcRecord" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "leader" TEXT NOT NULL DEFAULT '00000nam a2200000 a 4500',
    "controlNumber001" TEXT,
    "recordStatus" TEXT,
    "recordType" TEXT,
    "bibliographicLevel" TEXT,
    "encodingLevel" TEXT,
    "catalogingForm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarcRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MarcField" (
    "id" TEXT NOT NULL,
    "marcRecordId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "ind1" TEXT NOT NULL DEFAULT ' ',
    "ind2" TEXT NOT NULL DEFAULT ' ',
    "controlValue" TEXT,
    "fieldOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarcField_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MarcSubfield" (
    "id" TEXT NOT NULL,
    "marcFieldId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "subfieldOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarcSubfield_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MarcImportBatch" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "importedById" TEXT NOT NULL,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PREVIEW',
    "reportJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MarcImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MarcImportRecord" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "recordIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "controlNumber" TEXT,
    "title" TEXT,
    "author" TEXT,
    "isbn" TEXT,
    "callNumber" TEXT,
    "accessionNumber" TEXT,
    "errorMessage" TEXT,
    "duplicateOfBookId" TEXT,
    "importedBookId" TEXT,
    "previewJson" TEXT,

    CONSTRAINT "MarcImportRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarcRecord_bookId_key" ON "MarcRecord"("bookId");
CREATE INDEX IF NOT EXISTS "MarcRecord_controlNumber001_idx" ON "MarcRecord"("controlNumber001");
CREATE INDEX IF NOT EXISTS "MarcField_marcRecordId_tag_idx" ON "MarcField"("marcRecordId", "tag");
CREATE INDEX IF NOT EXISTS "MarcField_marcRecordId_fieldOrder_idx" ON "MarcField"("marcRecordId", "fieldOrder");
CREATE INDEX IF NOT EXISTS "MarcSubfield_marcFieldId_subfieldOrder_idx" ON "MarcSubfield"("marcFieldId", "subfieldOrder");
CREATE INDEX IF NOT EXISTS "MarcImportBatch_createdAt_idx" ON "MarcImportBatch"("createdAt");
CREATE INDEX IF NOT EXISTS "MarcImportBatch_importedById_idx" ON "MarcImportBatch"("importedById");
CREATE INDEX IF NOT EXISTS "MarcImportRecord_batchId_recordIndex_idx" ON "MarcImportRecord"("batchId", "recordIndex");
CREATE INDEX IF NOT EXISTS "MarcImportRecord_batchId_status_idx" ON "MarcImportRecord"("batchId", "status");

ALTER TABLE "MarcRecord" ADD CONSTRAINT "MarcRecord_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarcField" ADD CONSTRAINT "MarcField_marcRecordId_fkey" FOREIGN KEY ("marcRecordId") REFERENCES "MarcRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarcSubfield" ADD CONSTRAINT "MarcSubfield_marcFieldId_fkey" FOREIGN KEY ("marcFieldId") REFERENCES "MarcField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarcImportBatch" ADD CONSTRAINT "MarcImportBatch_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarcImportRecord" ADD CONSTRAINT "MarcImportRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MarcImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
