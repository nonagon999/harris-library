-- AlterTable
ALTER TABLE "Book" ADD COLUMN "lc_classification" TEXT;

-- CreateIndex
CREATE INDEX "Book_lc_classification_idx" ON "Book"("lc_classification");
