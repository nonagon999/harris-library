#!/usr/bin/env node
/**
 * Remove all library operational data (books, borrowers, transactions).
 * Keeps login accounts, categories, locations, and library settings.
 */
import { readFileSync, existsSync } from "fs";
import { PrismaClient } from "@prisma/client";

function loadEnv() {
  const loaded = {};
  for (const file of [".env", ".env.local"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      loaded[key] = val;
    }
  }
  for (const [key, val] of Object.entries(loaded)) {
    process.env[key] = val;
  }
}

loadEnv();

const prisma = new PrismaClient();

try {
  console.log("Clearing library data…\n");

  const tx = await prisma.borrowingTransaction.deleteMany();
  const audit = await prisma.auditLog.deleteMany();
  const copies = await prisma.bookCopy.deleteMany();
  const books = await prisma.book.deleteMany();
  const borrowers = await prisma.borrower.deleteMany();

  console.log(`  Transactions removed: ${tx.count}`);
  console.log(`  Audit logs removed:   ${audit.count}`);
  console.log(`  Book copies removed:  ${copies.count}`);
  console.log(`  Books removed:        ${books.count}`);
  console.log(`  Borrowers removed:    ${borrowers.count}`);
  console.log("\n✅ Dashboard is clear. Login accounts, categories, and locations are kept.");
  console.log("   Add your own data via Portal → Books / Borrowers / Circulation.\n");
} catch (error) {
  console.error("❌ Failed to clear data:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
