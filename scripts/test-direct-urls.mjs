import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const urls = [
  ["DATABASE_URL", process.env.DATABASE_URL],
  ["DIRECT_URL", process.env.DIRECT_URL],
].filter(([, url]) => url);

if (urls.length === 0) {
  console.error("Set DATABASE_URL and/or DIRECT_URL in .env.local");
  process.exit(1);
}

for (const [name, url] of urls) {
  process.stdout.write(`${name}... `);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("OK");
  } catch (e) {
    const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
    console.log("FAIL", msg.slice(0, 120));
  }
  await prisma.$disconnect();
}
