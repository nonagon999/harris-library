import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and configure it.");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Supabase connection OK.");
} catch (e) {
  const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
  console.error("Connection failed:", msg);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
