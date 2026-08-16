/**
 * Check and fix Company table constraints
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking Company table constraints...\n');
  
  // Get all indexes on Company table
  try {
    const indexes = await prisma.$queryRaw`SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='Company'`;
    console.log('Indexes on Company table:');
    console.log(indexes);
  } catch (e: any) {
    console.log('Error getting indexes:', e.message);
  }
  
  // Get table info
  try {
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info("Company")`;
    console.log('\\nTable info:');
    console.log(tableInfo);
  } catch (e: any) {
    console.log('Error getting table info:', e.message);
  }
  
  // Try to get actual SQL for the schema
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './db/custom.db';
  console.log('\\nDatabase path:', dbPath);
  
  await prisma.$disconnect();
}

main().catch(console.error).finally(() => process.exit(0));
