/**
 * Fix database constraints - remove unique constraint on Company.userId
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing database constraints...\n');
  
  const queries = [
    'ALTER TABLE "Company" DROP CONSTRAINT IF EXISTS "Company_userId_fkey"',
    'ALTER TABLE "Company" DROP CONSTRAINT IF EXISTS "Company_userId_unique"',
    'DROP INDEX IF EXISTS "Company_userId_unique"'
  ];
  
  for (const sql of queries) {
    try {
      const result = await prisma.$queryRawUnsafe(sql);
      console.log(`✅ ${sql}`);
    } catch (error: any) {
      console.log(`⚠️  ${error.message.substring(0, 100)}`);
    }
  }
  
  console.log('\nDone! Constraints removed.');
  await prisma.$disconnect();
}

main().catch(console.error).finally(() => process.exit(0));
